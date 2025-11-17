const createError = require('http-errors');
const { TransactionStatusLog, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');

const ENTITY_TYPE = 'transaction_status_log';

const runInTransaction = async (outerTransaction, handler) => {
	if (outerTransaction) {
		return handler(outerTransaction);
	}

	return sequelize.transaction(handler);
};

exports.listTransactionStatusLogs = async ({
	filters = {},
	includeChanger = false,
	includeTransaction = false,
	options = {},
} = {}) => {
	const { where = {}, ...rest } = options;
	const query = {
		where: { ...where, ...filters },
		...rest,
	};

	if (includeChanger || includeTransaction) {
		query.include = [];

		if (includeChanger) {
			query.include.push({ association: 'changer', attributes: ['id', 'username', 'role'] });
		}

		if (includeTransaction) {
			query.include.push({ association: 'transaction' });
		}
	}

	return TransactionStatusLog.findAll(query);
};

exports.getTransactionStatusLogById = async (id, { includeChanger = false, includeTransaction = false } = {}) => {
	const query = {};

	if (includeChanger || includeTransaction) {
		query.include = [];

		if (includeChanger) {
			query.include.push({ association: 'changer', attributes: ['id', 'username', 'role'] });
		}

		if (includeTransaction) {
			query.include.push({ association: 'transaction' });
		}
	}

	const log = await TransactionStatusLog.findByPk(id, query);

	if (!log) {
		throw createError(404, 'Transaction status log not found');
	}

	return log;
};

exports.createTransactionStatusLog = async ({
	transactionId,
	fromStatus = null,
	toStatus,
	note = null,
	actorUserId = null,
	changedAt = new Date(),
	transaction: outerTransaction,
}) => {
	if (!transactionId) {
		throw createError(400, 'transactionId is required');
	}

	if (!toStatus) {
		throw createError(400, 'toStatus is required');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const log = await TransactionStatusLog.create(
			{
				transaction_id: transactionId,
				from_status: fromStatus,
				to_status: toStatus,
				changed_by: actorUserId,
				changed_at: changedAt,
				note,
			},
			{ transaction }
		);

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: log.id,
			action: 'create',
			message: `Transaction ${transactionId} status changed to ${toStatus}`,
			meta: {
				transactionId,
				fromStatus,
				toStatus,
				note,
			},
			transaction,
		});

		return log;
	});
};
