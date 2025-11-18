const createError = require('http-errors');
const { TransactionPayment, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');

const ENTITY_TYPE = 'transaction_payment';

const runInTransaction = async (outerTransaction, handler) => {
	if (outerTransaction) {
		return handler(outerTransaction);
	}

	return sequelize.transaction(handler);
};

exports.listTransactionPayments = async ({
	filters = {},
	includeTransaction = false,
	options = {},
} = {}) => {
	const { where = {}, ...rest } = options;
	const query = {
		where: { ...where, ...filters },
		...rest,
	};

	if (includeTransaction) {
		query.include = [{ association: 'transaction' }];
	}

	return TransactionPayment.findAll(query);
};

exports.getTransactionPaymentById = async (paymentId, { includeTransaction = false } = {}) => {
	const query = {};

	if (includeTransaction) {
		query.include = [{ association: 'transaction' }];
	}

	const payment = await TransactionPayment.findByPk(paymentId, query);

	if (!payment) {
		throw createError(404, 'Transaction payment not found');
	}

	return payment;
};

exports.createTransactionPayment = async ({ data, actorUserId, transaction: outerTransaction }) => {
	if (!data?.transaction_id) {
		throw createError(400, 'transaction_id is required');
	}

	if (data.amount === undefined || data.amount === null) {
		throw createError(400, 'amount is required');
	}

	if (!data?.method) {
		throw createError(400, 'method is required');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const payment = await TransactionPayment.create(data, { transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: payment.id,
			action: 'create',
			message: `Transaction payment ${payment.id} created for transaction ${payment.transaction_id}`,
			meta: { payload: data },
			transaction,
		});

		return payment;
	});
};

exports.updateTransactionPayment = async ({ paymentId, data, actorUserId, transaction: outerTransaction }) => {
	if (!data || Object.keys(data).length === 0) {
		throw createError(400, 'Update payload is empty');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const payment = await TransactionPayment.findByPk(paymentId, { transaction });

		if (!payment) {
			throw createError(404, 'Transaction payment not found');
		}

		const before = payment.toJSON();
		await payment.update(data, { transaction });
		const after = payment.toJSON();

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: payment.id,
			action: 'update',
			message: `Transaction payment ${payment.id} updated`,
			meta: { before, after },
			transaction,
		});

		return payment;
	});
};

exports.deleteTransactionPayment = async ({ paymentId, actorUserId, transaction: outerTransaction }) => {
	return runInTransaction(outerTransaction, async (transaction) => {
		const payment = await TransactionPayment.findByPk(paymentId, { transaction });

		if (!payment) {
			throw createError(404, 'Transaction payment not found');
		}

		const archive = payment.toJSON();
		await payment.destroy({ transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: paymentId,
			action: 'delete',
			message: `Transaction payment ${paymentId} deleted`,
			meta: { before: archive },
			transaction,
		});
	});
};
