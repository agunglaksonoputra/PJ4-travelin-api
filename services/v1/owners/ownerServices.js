const createError = require('http-errors');
const { Owner, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');

const ENTITY_TYPE = 'owner';

const validateSharesPercentage = (value) => {
	if (value === undefined || value === null) {
		throw createError(400, 'shares_percentage is required');
	}

	const numericValue = Number(value);
	if (Number.isNaN(numericValue)) {
		throw createError(400, 'shares_percentage must be a number');
	}

	if (numericValue < 0 || numericValue > 100) {
		throw createError(400, 'shares_percentage must be between 0 and 100');
	}

	return numericValue;
};

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

	const payload = { ...data };
	payload.shares_percentage = validateSharesPercentage(payload.shares_percentage);

	return runInTransaction(outerTransaction, async (transaction) => {
		const owner = await Owner.create(payload, { transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: owner.id,
			action: 'create',
			message: `Owner ${owner.name} created`,
			meta: { payload },
			transaction,
		});

		return owner;
	});
};

exports.updateOwner = async ({ ownerId, data, actorUserId, transaction: outerTransaction }) => {
	if (!data || Object.keys(data).length === 0) {
		throw createError(400, 'Update payload is empty');
	}

	const payload = { ...data };
	if (Object.prototype.hasOwnProperty.call(payload, 'shares_percentage')) {
		payload.shares_percentage = validateSharesPercentage(payload.shares_percentage);
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const owner = await Owner.findByPk(ownerId, { transaction });

		if (!owner) {
			throw createError(404, 'Owner not found');
		}

		const before = owner.toJSON();
		await owner.update(payload, { transaction });
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
