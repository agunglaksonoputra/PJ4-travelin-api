const createError = require("http-errors");
const { OwnerWithdrawal, ProfitShare, Owner, MonthlyProfit, sequelize } = require("@models");
const { createActivityLog } = require("../activityLogs/activityLogsServices");

const ENTITY_TYPE = "owner_withdrawal";

const runInTransaction = async (outerTransaction, handler) => {
  if (outerTransaction) return handler(outerTransaction);
  return sequelize.transaction(handler);
};

exports.listOwnerWithdrawals = async ({ filters = {}, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;

  const { rows, count } = await OwnerWithdrawal.findAndCountAll({
    where: filters,
    include: [
      {
        model: Owner,
        as: "owner",
        // attributes: ["id", "name"],
      },
    ],
    order: [["withdrawn_at", "DESC"]],
    limit,
    offset,
  });

  return {
    data: rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

exports.createOwnerWithdrawal = async ({ data, actorUserId, transaction: outerTransaction }) => {
  const { owner_id, amount, method, note } = data;

  if (!owner_id) throw createError(400, "owner_id is required");
  if (!amount || Number(amount) <= 0) throw createError(400, "amount must be greater than 0");
  if (!method) throw createError(400, "method is required");

  return runInTransaction(outerTransaction, async (transaction) => {
    // 1️⃣ Total share
    const totalShare =
      (await ProfitShare.sum("share_amount", {
        where: { owner_id },
        transaction,
      })) || 0;

    if (totalShare <= 0) {
      throw createError(400, "Owner has no profit share");
    }

    // 2️⃣ Total withdrawal valid
    const totalWithdrawn =
      (await OwnerWithdrawal.sum("amount", {
        where: {
          owner_id,
          status: "completed",
          deleted_at: null,
        },
        transaction,
      })) || 0;

    const availableBalance = Number(totalShare) - Number(totalWithdrawn);

    if (Number(amount) > availableBalance) {
      throw createError(400, `Insufficient balance. Available: ${availableBalance}`);
    }

    // 3️⃣ Create withdrawal (FIXED)
    const withdrawal = await OwnerWithdrawal.create(
      {
        owner_id,
        withdrawn_at: new Date(),
        amount: Number(amount),
        method,
        note,
        status: "completed",
      },
      { transaction }
    );

    // 4️⃣ Activity log
    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: withdrawal.id,
      action: "create",
      message: `Owner ${owner_id} withdrew ${amount}`,
      meta: {
        owner_id,
        amount,
        previous_balance: availableBalance,
        remaining_balance: availableBalance - Number(amount),
      },
      transaction,
    });

    return withdrawal;
  });
};

exports.refundOwnerWithdrawal = async ({ withdrawalId, actorUserId, transaction: outerTransaction }) => {
  return runInTransaction(outerTransaction, async (transaction) => {
    const withdrawal = await OwnerWithdrawal.findByPk(withdrawalId, {
      transaction,
    });

    if (!withdrawal) {
      throw createError(404, "Owner withdrawal not found");
    }

    if (withdrawal.status === "refunded") {
      throw createError(400, "Withdrawal already refunded");
    }

    const before = withdrawal.toJSON();

    await withdrawal.update(
      {
        status: "refunded",
        deleted_at: new Date(),
      },
      { transaction }
    );

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: withdrawal.id,
      action: "refund",
      message: `Owner withdrawal ${withdrawal.id} refunded`,
      meta: {
        before,
        after: withdrawal.toJSON(),
      },
      transaction,
    });

    return withdrawal;
  });
};

exports.getOwnerWithdrawalById = async (withdrawalId, { includeOwner = false } = {}) => {
  if (!withdrawalId) {
    throw createError(400, "withdrawalId is required");
  }

  const query = {};

  if (includeOwner) {
    query.include = [
      {
        model: Owner,
        as: "owner",
        attributes: ["id", "name", "phone"],
      },
    ];
  }

  const withdrawal = await OwnerWithdrawal.findByPk(withdrawalId, query);

  if (!withdrawal) {
    throw createError(404, "Owner withdrawal not found");
  }

  return withdrawal;
};

exports.deleteOwnerWithdrawal = async ({ withdrawalId, actorUserId, transaction: outerTransaction }) => {
  if (!withdrawalId) {
    throw createError(400, "withdrawalId is required");
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const withdrawal = await OwnerWithdrawal.findByPk(withdrawalId, {
      transaction,
    });

    if (!withdrawal) {
      throw createError(404, "Owner withdrawal not found");
    }

    const before = withdrawal.toJSON();

    await withdrawal.destroy({ transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: withdrawalId,
      action: "delete",
      message: `Owner withdrawal ${withdrawalId} deleted`,
      meta: { before },
      transaction,
    });

    return true;
  });
};
