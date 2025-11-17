const createError = require('http-errors');
const { Tariff, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');

const ENTITY_TYPE = 'tariff';

const runInTransaction = async (outerTransaction, handler) => {
	if (outerTransaction) {
		return handler(outerTransaction);
	}

	return sequelize.transaction(handler);
};

exports.listTariffs = async ({ filters = {}, options = {} } = {}) => {
	const { where = {}, ...rest } = options;
	return Tariff.findAll({ where: { ...where, ...filters }, ...rest });
};

exports.getTariffById = async (tariffId, options = {}) => {
	const tariff = await Tariff.findByPk(tariffId, options);

	if (!tariff) {
		throw createError(404, 'Tariff not found');
	}

	return tariff;
};

exports.createTariff = async ({ data, actorUserId, transaction: outerTransaction }) => {
	if (!data?.code) {
		throw createError(400, 'code is required');
	}

	if (data.base_price === undefined || data.base_price === null) {
		throw createError(400, 'base_price is required');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const tariff = await Tariff.create(data, { transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: tariff.id,
			action: 'create',
			message: `Tariff ${tariff.code} created`,
			meta: { payload: data },
			transaction,
		});

		return tariff;
	});
};

exports.updateTariff = async ({ tariffId, data, actorUserId, transaction: outerTransaction }) => {
	if (!data || Object.keys(data).length === 0) {
		throw createError(400, 'Update payload is empty');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const tariff = await Tariff.findByPk(tariffId, { transaction });

		if (!tariff) {
			throw createError(404, 'Tariff not found');
		}

		const before = tariff.toJSON();
		await tariff.update(data, { transaction });
		const after = tariff.toJSON();

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: tariff.id,
			action: 'update',
			message: `Tariff ${tariff.code} updated`,
			meta: { before, after },
			transaction,
		});

		return tariff;
	});
};

exports.deleteTariff = async ({ tariffId, actorUserId, transaction: outerTransaction }) => {
	return runInTransaction(outerTransaction, async (transaction) => {
		const tariff = await Tariff.findByPk(tariffId, { transaction, paranoid: false });

		if (!tariff) {
			throw createError(404, 'Tariff not found');
		}

		const archive = tariff.toJSON();
		await tariff.destroy({ transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: tariffId,
			action: 'delete',
			message: `Tariff ${archive.code} deleted`,
			meta: { before: archive },
			transaction,
		});
	});
};
