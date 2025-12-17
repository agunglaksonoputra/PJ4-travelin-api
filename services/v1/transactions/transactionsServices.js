const createError = require('http-errors');
const { Transaction, Owner, ProfitShare, TransactionPayment, sequelize } = require('@models');
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

exports.getTransactionSummary = async ({ vehicleId } = {}) => {
	const where = {};

	if (vehicleId !== undefined && vehicleId !== null) {
		where.vehicle_id = vehicleId;
	}

	return Transaction.findAll({
		attributes: [
			'status',
			[sequelize.fn('COUNT', sequelize.col('id')), 'trip_count'],
			[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_cost')), 0), 'total_amount'],
		],
		where,
		group: ['status'],
		order: [['status', 'ASC']],
	});
};

// Get total paid_amount across all closed transactions
exports.getTotalPaidAmountClosed = async () => {
	const total = await Transaction.sum('paid_amount', { where: { status: 'closed' } });
	const numeric = Number(total || 0);
	if (!Number.isFinite(numeric)) return 0;
	return Math.round(numeric * 100) / 100;
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

			// Buat initial TransactionPayment record ketika status berubah dari 'planning' ke 'payment'
			await createInitialTransactionPaymentOnStatusChange({
				transactionRecord: record,
				previousStatus,
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

exports.setTransactionPaymentPlan = async ({
	transactionId,
	data,
	actorUserId,
	transaction: outerTransaction,
}) => {
	const method = data?.payment_plan_method || data?.method;
	if (!method) {
		throw createError(400, 'payment_plan_method is required');
	}

	const normalizedMethod = String(method).toLowerCase();
	if (!['cash', 'credit'].includes(normalizedMethod)) {
		throw createError(400, 'payment_plan_method must be either cash or credit');
	}

	const toCurrency = (value) => {
		if (value === undefined || value === null || value === '') {
			return 0;
		}
		const numberValue = Number(value);
		if (!Number.isFinite(numberValue)) {
			throw createError(400, 'paid_amount must be a valid number');
		}
		if (numberValue < 0) {
			throw createError(400, 'paid_amount cannot be negative');
		}
		return Math.round(numberValue * 100) / 100;
	};

	const paidAmount = toCurrency(data?.paid_amount ?? data?.amount ?? 0);

	return runInTransaction(outerTransaction, async (transaction) => {
		const record = await Transaction.findByPk(transactionId, { transaction });

		if (!record) {
			throw createError(404, 'Transaction not found');
		}

		const totalCost = toCurrency(record.total_cost ?? 0);
		if (totalCost > 0 && paidAmount > totalCost) {
			throw createError(400, 'paid_amount cannot exceed total_cost');
		}

		const outstandingRaw = totalCost - paidAmount;
		const outstandingAmount = outstandingRaw > 0
			? Math.round(outstandingRaw * 100) / 100
			: 0;

		const before = record.toJSON();
		await record.update(
			{
				payment_plan_method: normalizedMethod,
				paid_amount: paidAmount,
				outstanding_amount: outstandingAmount,
			},
			{ transaction }
		);
		const after = record.toJSON();

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: record.id,
			action: 'update',
			message: `Payment plan updated for transaction ${record.trip_code}`,
			meta: {
				before,
				after,
				payload: {
					payment_plan_method: normalizedMethod,
					paid_amount: paidAmount,
					outstanding_amount: outstandingAmount,
				},
			},
			transaction,
		});

		return record;
	});
};

const createInitialTransactionPaymentOnStatusChange = async ({
	transactionRecord,
	previousStatus,
	actorUserId,
	transaction,
}) => {

	const currentStatus = String(transactionRecord.status || '').toLowerCase();
	const prevStatus = String(previousStatus || '').toLowerCase();

	if (prevStatus !== 'planning' || currentStatus !== 'payment') {
		return;
	}

	const existingPayments = await TransactionPayment.count(
		{ where: { transaction_id: transactionRecord.id }, transaction }
	);

	if (existingPayments > 0) {
		return;
	}

	const initialPayment = await TransactionPayment.create(
		{
			transaction_id: transactionRecord.id,
			paid_at: new Date(),
			method: 'transfer',
			amount: 0,
			note: 'Initial payment record created when transaction moved to payment status',
		},
		{ transaction }
	);

	await createActivityLog({
		actorUserId,
		entityType: 'transaction_payment',
		entityId: initialPayment.id,
		action: 'create',
		message: `Initial TransactionPayment record created for transaction ${transactionRecord.trip_code} when status changed to payment`,
		meta: {
			transactionId: transactionRecord.id,
			statusTransition: `${prevStatus} -> ${currentStatus}`,
			paymentData: {
				transaction_id: transactionRecord.id,
				method: 'transfer',
				amount: 0,
			},
		},
		transaction,
	});
};

const round2 = (n) => Number((Math.round(Number(n) * 100) / 100).toFixed(2));

const distributeProfitSharesToOwners = async ({ transactionRecord, actorUserId, transaction }) => {
	const total = Number(transactionRecord.total_cost || 0);
	if (!Number.isFinite(total) || total <= 0) {
		return;
	}

	const owners = await Owner.findAll({ attributes: ['id', 'name', 'shares_percentage'], transaction });
	if (!owners || owners.length === 0) return;

	for (const owner of owners) {
		const percentage = Number(owner.shares_percentage || 0);
		if (!Number.isFinite(percentage) || percentage <= 0) continue;

		const shareAmount = round2((percentage / 100) * total);

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

exports.getTransactionsByStatus = async ({ status, limit = 1 } = {}) => {
	const where = {};

	if (status) {
		where.status = status;
	}

	return Transaction.findAll({
		where,
		limit: limit > 0 ? limit : undefined,
		order: [['created_at', 'DESC']],
	});
};

exports.getOneTransactionPerStatus = async () => {
	const statuses = ['planning', 'payment', 'reporting', 'closed', 'canceled'];
	const result = {};

	for (const status of statuses) {
		const transaction = await Transaction.findOne({
			where: { status },
			order: [['created_at', 'DESC']],
		});
		result[status] = transaction || null;
	}

	return result;
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
