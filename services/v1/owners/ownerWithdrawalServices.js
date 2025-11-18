const createError = require('http-errors');
const { OwnerWithdrawal, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');

const ENTITY_TYPE = 'owner_withdrawal';

const runInTransaction = async (outerTransaction, handler) => {
	if (outerTransaction) {
		return handler(outerTransaction);
	}

	return sequelize.transaction(handler);
};

exports.listOwnerWithdrawals = async ({ filters = {}, options = {} } = {}) => {
	const { where = {}, ...rest } = options;
	return OwnerWithdrawal.findAll({ where: { ...where, ...filters }, ...rest });
};

exports.getOwnerWithdrawalById = async (withdrawalId, options = {}) => {
	const withdrawal = await OwnerWithdrawal.findByPk(withdrawalId, options);

	if (!withdrawal) {
		throw createError(404, 'Owner withdrawal not found');
	}

	return withdrawal;
};

exports.createOwnerWithdrawal = async ({ data, actorUserId, transaction: outerTransaction }) => {
	if (!data?.owner_id) {
		throw createError(400, 'owner_id is required');
	}

	if (data.amount === undefined || data.amount === null) {
		throw createError(400, 'amount is required');
	}

	if (!data?.method) {
		throw createError(400, 'method is required');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const withdrawal = await OwnerWithdrawal.create(data, { transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: withdrawal.id,
			action: 'create',
			message: `Owner withdrawal ${withdrawal.id} created for owner ${withdrawal.owner_id}`,
			meta: { payload: data },
			transaction,
		});

		return withdrawal;
	});
};

exports.updateOwnerWithdrawal = async ({ withdrawalId, data, actorUserId, transaction: outerTransaction }) => {
	if (!data || Object.keys(data).length === 0) {
		throw createError(400, 'Update payload is empty');
	}

	return runInTransaction(outerTransaction, async (transaction) => {
		const withdrawal = await OwnerWithdrawal.findByPk(withdrawalId, { transaction });

		if (!withdrawal) {
			throw createError(404, 'Owner withdrawal not found');
		}

		const before = withdrawal.toJSON();
		await withdrawal.update(data, { transaction });
		const after = withdrawal.toJSON();

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: withdrawal.id,
			action: 'update',
			message: `Owner withdrawal ${withdrawal.id} updated`,
			meta: { before, after },
			transaction,
		});

		return withdrawal;
	});
};

exports.deleteOwnerWithdrawal = async ({ withdrawalId, actorUserId, transaction: outerTransaction }) => {
	return runInTransaction(outerTransaction, async (transaction) => {
		const withdrawal = await OwnerWithdrawal.findByPk(withdrawalId, { transaction });

		if (!withdrawal) {
			throw createError(404, 'Owner withdrawal not found');
		}

		const archive = withdrawal.toJSON();
		await withdrawal.destroy({ transaction });

		await createActivityLog({
			actorUserId,
			entityType: ENTITY_TYPE,
			entityId: withdrawalId,
			action: 'delete',
			message: `Owner withdrawal ${withdrawalId} deleted`,
			meta: { before: archive },
			transaction,
		});
	});
};
