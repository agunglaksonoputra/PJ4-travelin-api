const createError = require('http-errors');
const { Transaction, Owner, ProfitShare, sequelize } = require('@models');
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

			// When status becomes 'closed', distribute profit to all owners
			if (after.status === 'closed' && previousStatus !== 'closed') {
				await distributeProfitSharesToOwners({ transactionRecord: record, actorUserId, transaction });
			}
		}

		return record;
	});
};

// Helper: distribute profit shares to all owners based on shares_percentage
const round2 = (n) => Number((Math.round(Number(n) * 100) / 100).toFixed(2));

const distributeProfitSharesToOwners = async ({ transactionRecord, actorUserId, transaction }) => {
	const total = Number(transactionRecord.total_cost || 0);
	if (!Number.isFinite(total) || total <= 0) {
		return; // Nothing to distribute
	}

	const owners = await Owner.findAll({ attributes: ['id', 'name', 'shares_percentage'], transaction });
	if (!owners || owners.length === 0) return;

	for (const owner of owners) {
		const percentage = Number(owner.shares_percentage || 0);
		if (!Number.isFinite(percentage) || percentage <= 0) continue;

		const shareAmount = round2((percentage / 100) * total);

		// Upsert by (transaction_id, owner_id)
		const existing = await ProfitShare.findOne({
			where: { transaction_id: transactionRecord.id, owner_id: owner.id },
			transaction,
		});

		if (existing) {
			const before = existing.toJSON();
			await existing.update({ share_amount: shareAmount, calculated_at: new Date() }, { transaction });
			const after = existing.toJSON();

			await createActivityLog({
				actorUserId,
				entityType: 'profit_share',
				entityId: existing.id,
				action: 'update',
				message: `Profit share updated for transaction ${transactionRecord.id} owner ${owner.id}`,
				meta: { before, after },
				transaction,
			});
		} else {
			const created = await ProfitShare.create(
				{
					transaction_id: transactionRecord.id,
					owner_id: owner.id,
					share_amount: shareAmount,
					calculated_at: new Date(),
					note: 'Auto calculated on transaction closed',
				},
				{ transaction }
			);

			await createActivityLog({
				actorUserId,
				entityType: 'profit_share',
				entityId: created.id,
				action: 'create',
				message: `Profit share created for transaction ${transactionRecord.id} owner ${owner.id}`,
				meta: { transactionId: transactionRecord.id, ownerId: owner.id, shareAmount },
				transaction,
			});
		}
	}
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
