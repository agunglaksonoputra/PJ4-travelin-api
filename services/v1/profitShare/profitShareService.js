const createError = require("http-errors");
const { ProfitShare, MonthlyProfit, Owner, sequelize } = require("@models");
const { createActivityLog } = require("../activityLogs/activityLogsServices");

const ENTITY_TYPE = "profit_share";

const runInTransaction = async (outerTransaction, handler) => {
  if (outerTransaction) {
    return handler(outerTransaction);
  }

  return sequelize.transaction(handler);
};

const validateShareAmount = (value) => {
  if (value === undefined || value === null) {
    throw createError(400, "share_amount is required");
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    throw createError(400, "share_amount must be a number");
  }

  if (numericValue < 0) {
    throw createError(400, "share_amount must be greater than or equal to 0");
  }

  return numericValue;
};

exports.listProfitShares = async ({ filters = {}, includeTransaction = false, includeOwner = false, options = {} } = {}) => {
  const { where = {}, include = [], ...rest } = options;
  const query = {
    where: { ...where, ...filters },
    include: [...include],
    ...rest,
  };

  if (includeTransaction) {
    query.include.push({ association: "transaction" });
  }

  if (includeOwner) {
    query.include.push({ association: "owner" });
  }

  if (query.include.length === 0) {
    delete query.include;
  }

  return ProfitShare.findAll(query);
};

exports.getProfitShareById = async (profitShareId, { includeTransaction = false, includeOwner = false } = {}) => {
  const query = {};
  const include = [];

  if (includeTransaction) {
    include.push({ association: "transaction" });
  }

  if (includeOwner) {
    include.push({ association: "owner" });
  }

  if (include.length > 0) {
    query.include = include;
  }

  const profitShare = await ProfitShare.findByPk(profitShareId, query);

  if (!profitShare) {
    throw createError(404, "Profit share not found");
  }

  return profitShare;
};

exports.createProfitShare = async ({ data, actorUserId, transaction: outerTransaction }) => {
  if (!data?.transaction_id) {
    throw createError(400, "transaction_id is required");
  }

  if (!data?.owner_id) {
    throw createError(400, "owner_id is required");
  }

  const payload = { ...data };
  payload.share_amount = validateShareAmount(payload.share_amount);

  return runInTransaction(outerTransaction, async (transaction) => {
    // prevent duplicate per (transaction_id, owner_id)
    const existing = await ProfitShare.findOne({
      where: { transaction_id: payload.transaction_id, owner_id: payload.owner_id },
      transaction,
    });
    if (existing) throw createError(409, "Profit share for this transaction and owner already exists");

    const profitShare = await ProfitShare.create(payload, { transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: profitShare.id,
      action: "create",
      message: `Profit share created for transaction ${profitShare.transaction_id}`,
      meta: { payload },
      transaction,
    });

    return profitShare;
  });
};

exports.updateProfitShare = async ({ profitShareId, data, actorUserId, transaction: outerTransaction }) => {
  if (!data || Object.keys(data).length === 0) {
    throw createError(400, "Update payload is empty");
  }

  const payload = { ...data };
  if (Object.prototype.hasOwnProperty.call(payload, "share_amount")) {
    payload.share_amount = validateShareAmount(payload.share_amount);
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const profitShare = await ProfitShare.findByPk(profitShareId, { transaction });

    if (!profitShare) {
      throw createError(404, "Profit share not found");
    }

    // Check composite duplication if transaction_id or owner_id changes
    const newTransactionId = Object.prototype.hasOwnProperty.call(payload, "transaction_id") ? payload.transaction_id : profitShare.transaction_id;
    const newOwnerId = Object.prototype.hasOwnProperty.call(payload, "owner_id") ? payload.owner_id : profitShare.owner_id;

    if (newTransactionId !== profitShare.transaction_id || newOwnerId !== profitShare.owner_id) {
      const duplicate = await ProfitShare.findOne({
        where: { transaction_id: newTransactionId, owner_id: newOwnerId },
        transaction,
      });
      if (duplicate) throw createError(409, "Profit share for this transaction and owner already exists");
    }

    const before = profitShare.toJSON();
    await profitShare.update(payload, { transaction });
    const after = profitShare.toJSON();

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: profitShare.id,
      action: "update",
      message: `Profit share ${profitShare.id} updated`,
      meta: { before, after },
      transaction,
    });

    return profitShare;
  });
};

exports.deleteProfitShare = async ({ profitShareId, actorUserId, transaction: outerTransaction }) => {
  return runInTransaction(outerTransaction, async (transaction) => {
    const profitShare = await ProfitShare.findByPk(profitShareId, { transaction });

    if (!profitShare) {
      throw createError(404, "Profit share not found");
    }

    const archive = profitShare.toJSON();
    await profitShare.destroy({ transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: profitShareId,
      action: "delete",
      message: `Profit share ${profitShareId} deleted`,
      meta: { before: archive },
      transaction,
    });
  });
};

exports.autoCalculateProfitShare = async ({ month, actorUserId, transaction: outerTransaction }) => {
  if (!month) {
    throw createError(400, "month (YYYY-MM) is required");
  }

  const run = async (t) => {
    // 1️⃣ Ambil monthly profit
    const monthlyProfit = await MonthlyProfit.findOne({
      where: { month },
      transaction: t,
    });

    if (!monthlyProfit) {
      throw createError(404, "Monthly profit not found");
    }

    const totalProfit = Number(monthlyProfit.total_profit) || 0;
    if (totalProfit <= 0) {
      return { month, total_profit: 0, owners_count: 0, shares: [] };
    }

    // 2️⃣ Ambil owner
    const owners = await Owner.findAll({
      attributes: ["id", "shares_percentage"],
      where: {
        is_active: true,
      },
      transaction: t,
    });

    const results = [];

    // 3️⃣ LOOP OWNER (AMAN, TANPA UPSERT)
    for (const owner of owners) {
      const percentage = Number(owner.shares_percentage) || 0;
      if (percentage <= 0) continue;

      const shareAmount = (totalProfit * percentage) / 100;

      const existing = await ProfitShare.findOne({
        where: {
          monthly_profit_id: monthlyProfit.id,
          owner_id: owner.id,
        },
        transaction: t,
      });

      let row;
      if (existing) {
        row = await existing.update(
          {
            share_amount: shareAmount,
            calculated_at: new Date(),
            note: `Auto recalculated for ${month}`,
          },
          { transaction: t }
        );
      } else {
        row = await ProfitShare.create(
          {
            monthly_profit_id: monthlyProfit.id,
            owner_id: owner.id,
            share_amount: shareAmount,
            calculated_at: new Date(),
            note: `Auto calculated for ${month}`,
          },
          { transaction: t }
        );
      }

      results.push(row);
    }

    return {
      month,
      total_profit: totalProfit,
      owners_count: results.length,
      shares: results,
    };
  };

  if (outerTransaction) return run(outerTransaction);
  return sequelize.transaction(run);
};

exports.closeMonthlyProfitAndCalculateShare = async ({ month, actorUserId }) => {
  return sequelize.transaction(async (transaction) => {
    // ⚠️ asumsi monthly profit sudah auto-update saat transaksi closed
    // jika perlu hard-recalc, panggil service calculateMonthlyProfit di sini

    const result = await exports.autoCalculateProfitShare({
      month,
      actorUserId,
      transaction,
    });

    return result;
  });
};
