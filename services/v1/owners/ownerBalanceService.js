const { ProfitShare, OwnerWithdrawal, Owner, Sequelize } = require("@models");

/**
 * Hitung saldo tersedia owner
 */
exports.getAvailableBalance = async (owner_id) => {
  // total share
  const shareResult = await ProfitShare.findOne({
    attributes: [[Sequelize.fn("SUM", Sequelize.col("share_amount")), "total_share"]],
    where: { owner_id },
    raw: true,
  });

  // total withdrawal
  const withdrawResult = await OwnerWithdrawal.findOne({
    attributes: [[Sequelize.fn("SUM", Sequelize.col("amount")), "total_withdrawn"]],
    where: { owner_id },
    raw: true,
  });

  const totalShare = Number(shareResult?.total_share) || 0;
  const totalWithdrawn = Number(withdrawResult?.total_withdrawn) || 0;

  return {
    total_share: totalShare,
    total_withdrawn: totalWithdrawn,
    available_balance: totalShare - totalWithdrawn,
  };
};

exports.getAllAvailableBalanceWithOwner = async ({ page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;

  // 🔹 total owner (untuk meta)
  const totalCount = await Owner.count();

  /**
   * 1️⃣ Total share per owner
   */
  const shares = await ProfitShare.findAll({
    attributes: ["owner_id", [Sequelize.fn("SUM", Sequelize.col("share_amount")), "total_share"]],
    include: [
      {
        model: Owner,
        as: "owner",
        attributes: ["id", "name"],
      },
    ],
    group: ["owner_id", "owner.id", "owner.name"],
    order: [[Sequelize.literal('"owner"."id"'), "ASC"]],
    limit,
    offset,
    raw: true,
  });

  /**
   * 2️⃣ Total withdrawal per owner
   */
  const withdrawals = await OwnerWithdrawal.findAll({
    attributes: ["owner_id", [Sequelize.fn("SUM", Sequelize.col("amount")), "total_withdrawn"]],
    where: {
      status: "completed",
      deleted_at: null,
    },
    group: ["owner_id"],
    raw: true,
  });

  const withdrawalMap = {};
  withdrawals.forEach((w) => {
    withdrawalMap[w.owner_id] = Number(w.total_withdrawn) || 0;
  });

  /**
   * 3️⃣ Mapping final
   */
  const data = shares.map((s) => {
    const totalShare = Number(s.total_share) || 0;
    const totalWithdrawn = withdrawalMap[s.owner_id] || 0;

    return {
      owner_id: s.owner_id,
      owner_name: s["owner.name"],
      total_share: totalShare,
      total_withdrawn: totalWithdrawn,
      available_balance: totalShare - totalWithdrawn,
    };
  });

  return {
    data,
    meta: {
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};
