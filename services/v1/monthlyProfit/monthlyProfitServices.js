const createError = require("http-errors");
const { MonthlyProfit, ProfitCache, Transaction, sequelize } = require("@models");
const { autoCalculateProfitShare } = require("../profitShare/profitShareService");

/**
 * Hitung & simpan profit bulanan
 * @param {String} month - format YYYY-MM (contoh: 2026-01)
 */
exports.calculateMonthlyProfit = async ({ month, note, transaction: outerTransaction }) => {
  if (!month) {
    throw createError(400, "month (YYYY-MM) is required");
  }

  const run = async (t) => {
    // 1️⃣ Hitung total profit bulan (HANYA transaksi CLOSED)
    const result = await ProfitCache.findOne({
      attributes: [[sequelize.fn("SUM", sequelize.col("total")), "total_profit"]],
      include: [
        {
          model: Transaction,
          as: "transaction",
          attributes: [],
          where: { status: "closed" },
        },
      ],
      where: sequelize.where(sequelize.fn("to_char", sequelize.col("ProfitCache.created_at"), "YYYY-MM"), month),
      raw: true,
      transaction: t,
    });

    const totalProfit = Number(result?.total_profit) || 0;

    // 2️⃣ UPSERT Monthly Profit (IDEMPOTENT)
    await MonthlyProfit.upsert(
      {
        month,
        total_profit: totalProfit,
        calculated_at: new Date(),
        note: note || `Auto calculated for ${month}`,
      },
      { transaction: t }
    );

    // 3️⃣ WAJIB RE-FETCH
    const monthlyProfit = await MonthlyProfit.findOne({
      where: { month },
      transaction: t,
    });

    if (!monthlyProfit) {
      throw createError(500, "Failed to fetch monthly profit after upsert");
    }

    // 4️⃣ AUTO GENERATE / UPDATE PROFIT SHARE UNTUK SEMUA OWNER
    await autoCalculateProfitShare({
      month,
      actorUserId: null, // system
      transaction: t,
    });

    return monthlyProfit;
  };

  if (outerTransaction) return run(outerTransaction);
  return sequelize.transaction(run);
};

/**
 * Ambil daftar profit bulanan
 */
exports.listMonthlyProfits = async () => {
  return MonthlyProfit.findAll({
    order: [["month", "DESC"]],
  });
};

/**
 * Ambil profit per bulan
 */
exports.getMonthlyProfitByMonth = async (month) => {
  const profit = await MonthlyProfit.findOne({ where: { month } });

  if (!profit) {
    throw createError(404, "Monthly profit not found");
  }

  return profit;
};

exports.recalculateMonthlyProfitByDate = async ({ date, transaction }) => {
  if (!date) throw createError(400, "date is required");

  const month = date.toISOString().slice(0, 7);

  return exports.calculateMonthlyProfit({
    month,
    note: "Auto recalculated on transaction close",
    transaction,
  });
};
