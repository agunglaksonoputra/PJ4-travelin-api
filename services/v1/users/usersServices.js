const createError = require('http-errors');
const { User, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');
const bcrypt = require('bcrypt');

const ENTITY_TYPE = 'user';

const runInTransaction = async (outerTransaction, handler) => {
	if (outerTransaction) {
		return handler(outerTransaction);
	}

	return sequelize.transaction(handler);
};

exports.listUsers = async ({ filters = {}, options = {} } = {}) => {
	const { where = {}, ...rest } = options;
	return User.findAll({ 
		where: { ...where, ...filters }, 
		attributes: { exclude: ['password'] },
		...rest 
	});
};

exports.getUserById = async (userId, options = {}) => {
	const user = await User.findByPk(userId, {
		attributes: { exclude: ['password'] },
		...options
	});

	if (!user) {
		throw createError(404, 'User not found');
	}

	return user;
};

exports.createUser = async ({ data, actorUserId, transaction: outerTransaction }) => {
	if (!data?.username) {
		throw createError(400, 'username is required');
	}
	if (!data?.password) {
		throw createError(400, 'password is required');
	}
	if (!data?.name) {
		throw createError(400, 'name is required');
	}
	if (!data?.role) {
		throw createError(400, 'role is required');
	}

	// Check if username already exists
	const existingUser = await User.findOne({ where: { username: data.username } });
	if (existingUser) {
		throw createError(409, 'Username already exists');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		// Hash password
		const hashedPassword = await bcrypt.hash(data.password, 10);
		const userData = { ...data, password: hashedPassword };

		const user = await User.create(userData, { transaction });

		// Create activity log
		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: user.id,
			action: 'create',
			message: `User ${user.username} created`,
			meta: { payload: { ...data, password: '***' } },
			transaction,
		});

		// Return user without password
		return user.toJSON();
	});
};

exports.updateUser = async ({ userId, data, actorUserId, transaction: outerTransaction }) => {
	if (!data || Object.keys(data).length === 0) {
		throw createError(400, 'Update payload is empty');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const user = await User.findByPk(userId, { transaction });

		if (!user) {
			throw createError(404, 'User not found');
		}

		// Check if username is being updated and if it already exists
		if (data.username && data.username !== user.username) {
			const existingUser = await User.findOne({ 
				where: { username: data.username },
				transaction 
			});
			if (existingUser) {
				throw createError(409, 'Username already exists');
			}
		}

		const before = user.toJSON();
		
		// Hash password if being updated
		if (data.password) {
			data.password = await bcrypt.hash(data.password, 10);
		}

		await user.update(data, { transaction });
		const after = user.toJSON();

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: user.id,
			action: 'update',
			message: `User ${user.username} updated`,
			meta: { 
				before: { ...before, password: '***' }, 
				after: { ...after, password: '***' } 
			},
			transaction,
		});

		return user;
	});
};

exports.deleteUser = async ({ userId, actorUserId, transaction: outerTransaction }) => {
	return runInTransaction(outerTransaction, async (transaction) => {
		const user = await User.findByPk(userId, { transaction });

		if (!user) {
			throw createError(404, 'User not found');
		}

		// Prevent user from deleting their own account
		if (parseInt(userId) === parseInt(actorUserId)) {
			throw createError(403, 'You cannot delete your own account');
		}

		const archive = user.toJSON();
		await user.destroy({ transaction });

		// Create activity log AFTER deleting user
		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: userId,
			action: 'delete',
			message: `User ${archive.username} deleted`,
			meta: { before: { ...archive, password: '***' } },
			transaction,
		});

		return archive;
	});
};
