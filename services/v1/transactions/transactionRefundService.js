const createError = require('http-errors');
const { TransactionRefund, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');

const ENTITY_TYPE = 'transaction_refund';

const runInTransaction = async (outerTransaction, handler) => {
	if (outerTransaction) {
		return handler(outerTransaction);
	}

	return sequelize.transaction(handler);
};

exports.listTransactionRefunds = async ({
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

	return TransactionRefund.findAll(query);
};

exports.getTransactionRefundById = async (refundId, { includeTransaction = false } = {}) => {
	const query = {};

	if (includeTransaction) {
		query.include = [{ association: 'transaction' }];
	}

	const refund = await TransactionRefund.findByPk(refundId, query);

	if (!refund) {
		throw createError(404, 'Transaction refund not found');
	}

	return refund;
};

exports.createTransactionRefund = async ({ data, actorUserId, transaction: outerTransaction }) => {
	if (!data?.transaction_id) {
		throw createError(400, 'transaction_id is required');
	}

	if (data.amount === undefined || data.amount === null) {
		throw createError(400, 'amount is required');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const refund = await TransactionRefund.create(data, { transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: refund.id,
			action: 'create',
			message: `Transaction refund ${refund.id} created for transaction ${refund.transaction_id}`,
			meta: { payload: data },
			transaction,
		});

		return refund;
	});
};

exports.updateTransactionRefund = async ({ refundId, data, actorUserId, transaction: outerTransaction }) => {
	if (!data || Object.keys(data).length === 0) {
		throw createError(400, 'Update payload is empty');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const refund = await TransactionRefund.findByPk(refundId, { transaction });

		if (!refund) {
			throw createError(404, 'Transaction refund not found');
		}

		const before = refund.toJSON();
		await refund.update(data, { transaction });
		const after = refund.toJSON();

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: refund.id,
			action: 'update',
			message: `Transaction refund ${refund.id} updated`,
			meta: { before, after },
			transaction,
		});

		return refund;
	});
};

exports.deleteTransactionRefund = async ({ refundId, actorUserId, transaction: outerTransaction }) => {
	return runInTransaction(outerTransaction, async (transaction) => {
		const refund = await TransactionRefund.findByPk(refundId, { transaction });

		if (!refund) {
			throw createError(404, 'Transaction refund not found');
		}

		const archive = refund.toJSON();
		await refund.destroy({ transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: refundId,
			action: 'delete',
			message: `Transaction refund ${refundId} deleted`,
			meta: { before: archive },
			transaction,
		});
	});
};
