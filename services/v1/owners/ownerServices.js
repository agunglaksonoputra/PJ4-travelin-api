const createError = require('http-errors');
const { Owner, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');

const ENTITY_TYPE = 'owner';

const runInTransaction = async (outerTransaction, handler) => {
	if (outerTransaction) {
		return handler(outerTransaction);
	}

	return sequelize.transaction(handler);
};

exports.listOwners = async ({ filters = {}, options = {} } = {}) => {
	const { where = {}, ...rest } = options;
	return Owner.findAll({ where: { ...where, ...filters }, ...rest });
};

exports.getOwnerById = async (ownerId, options = {}) => {
	const owner = await Owner.findByPk(ownerId, options);

	if (!owner) {
		throw createError(404, 'Owner not found');
	}

	return owner;
};

exports.createOwner = async ({ data, actorUserId, transaction: outerTransaction }) => {
	if (!data?.name) {
		throw createError(400, 'name is required');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const owner = await Owner.create(data, { transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: owner.id,
			action: 'create',
			message: `Owner ${owner.name} created`,
			meta: { payload: data },
			transaction,
		});

		return owner;
	});
};

exports.updateOwner = async ({ ownerId, data, actorUserId, transaction: outerTransaction }) => {
	if (!data || Object.keys(data).length === 0) {
		throw createError(400, 'Update payload is empty');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const owner = await Owner.findByPk(ownerId, { transaction });

		if (!owner) {
			throw createError(404, 'Owner not found');
		}

		const before = owner.toJSON();
		await owner.update(data, { transaction });
		const after = owner.toJSON();

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: owner.id,
			action: 'update',
			message: `Owner ${owner.name} updated`,
			meta: { before, after },
			transaction,
		});

		return owner;
	});
};

exports.deleteOwner = async ({ ownerId, actorUserId, transaction: outerTransaction }) => {
	return runInTransaction(outerTransaction, async (transaction) => {
		const owner = await Owner.findByPk(ownerId, { transaction });

		if (!owner) {
			throw createError(404, 'Owner not found');
		}

		const archive = owner.toJSON();
		await owner.destroy({ transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: ownerId,
			action: 'delete',
			message: `Owner ${archive.name} deleted`,
			meta: { before: archive },
			transaction,
		});
	});
};
