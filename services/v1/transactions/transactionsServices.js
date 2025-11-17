const createError = require('http-errors');
const { Transaction, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');
const { createTransactionStatusLog } = require('./transactionsStatusLogsServices');

const ENTITY_TYPE = 'transaction';

const runInTransaction = async (outerTransaction, handler) => {
	if (outerTransaction) {
		return handler(outerTransaction);
	}

	return sequelize.transaction(handler);
};

exports.listTransactions = async ({ filters = {}, options = {} } = {}) => {
	const { where = {}, ...rest } = options;
	return Transaction.findAll({ where: { ...where, ...filters }, ...rest });
};

exports.getTransactionById = async (transactionId, options = {}) => {
	const transaction = await Transaction.findByPk(transactionId, options);

	if (!transaction) {
		throw createError(404, 'Transaction not found');
	}

	return transaction;
};

exports.createTransaction = async ({ data, actorUserId, transaction: outerTransaction }) => {
	if (!data?.trip_code) {
		throw createError(400, 'trip_code is required');
	}

	if (!data?.customer_name) {
		throw createError(400, 'customer_name is required');
	}

	if (!data?.vehicle_id) {
		throw createError(400, 'vehicle_id is required');
	}

	if (!data?.start_date || !data?.end_date) {
		throw createError(400, 'start_date and end_date are required');
	}

	if (data.price_per_day === undefined || data.price_per_day === null) {
		throw createError(400, 'price_per_day is required');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const payload = { ...data, created_by: actorUserId };
		const record = await Transaction.create(payload, { transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: record.id,
			action: 'create',
			message: `Transaction ${record.trip_code} created`,
			meta: { payload: data },
			transaction,
		});

		await createTransactionStatusLog({
			transactionId: record.id,
			fromStatus: null,
			toStatus: record.status,
			note: 'Initial status',
			actorUserId,
			transaction,
		});

		return record;
	});
};

exports.updateTransaction = async ({ transactionId, data, actorUserId, transaction: outerTransaction }) => {
	if (!data || Object.keys(data).length === 0) {
		throw createError(400, 'Update payload is empty');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const record = await Transaction.findByPk(transactionId, { transaction });

		if (!record) {
			throw createError(404, 'Transaction not found');
		}

		const before = record.toJSON();
		const previousStatus = before.status;

		await record.update(data, { transaction });
		const after = record.toJSON();

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: record.id,
			action: 'update',
			message: `Transaction ${record.trip_code} updated`,
			meta: { before, after },
			transaction,
		});

		if (data.status && after.status !== previousStatus) {
			await createTransactionStatusLog({
				transactionId: record.id,
				fromStatus: previousStatus,
				toStatus: after.status,
				actorUserId,
				transaction,
			});
		}

		return record;
	});
};

exports.deleteTransaction = async ({ transactionId, actorUserId, transaction: outerTransaction }) => {
	return runInTransaction(outerTransaction, async (transaction) => {
		const record = await Transaction.findByPk(transactionId, { transaction, paranoid: false });

		if (!record) {
			throw createError(404, 'Transaction not found');
		}

		const archive = record.toJSON();
		await record.destroy({ transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: transactionId,
			action: 'delete',
			message: `Transaction ${archive.trip_code} deleted`,
			meta: { before: archive },
			transaction,
		});
	});
};
