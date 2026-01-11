const createError = require("http-errors");
const { ProfitCache, Transaction, TransactionReport, TransactionPayment, Vehicle, MonthlyProfit, sequelize } = require("@models");
const { Op, Sequelize } = require("sequelize");

const runInTransaction = async (outerTransaction, handler) => {
  if (outerTransaction) return handler(outerTransaction);
  return sequelize.transaction(handler);
};

const calculateProfit = (paidAmount, operationalCost) => {
  return Number(paidAmount) - Number(operationalCost);
};

exports.updateProfitCache = async (transactionId, { transaction: outerTransaction }) => {
  if (!transactionId) {
    throw createError(400, "transaction_id is required for ProfitCache");
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const tx = await Transaction.findByPk(transactionId, {
      attributes: ["id", "paid_amount"],
      transaction,
    });

    if (!tx) throw createError(404, "Transaction not found");

    const report = await TransactionReport.findOne({
      where: { transaction_id: transactionId },
      attributes: ["total_operational_cost"],
      transaction,
    });

    if (!report) throw createError(404, "Transaction report not found");

    const paidAmount = Number(tx.paid_amount) || 0;
    const operationalCost = Number(report.total_operational_cost) || 0;
    const total = calculateProfit(paidAmount, operationalCost);

    const payload = {
      transaction_id: transactionId,
      paid_amount: paidAmount,
      operational_cost: operationalCost,
      total,
    };

    // upsert logic
    const [cache, created] = await ProfitCache.upsert(payload, {
      returning: true,
      transaction,
    });

    return {
      cache,
      created,
      payload,
    };
  });
};

exports.deleteProfitCache = async (transactionId, { transaction: outerTransaction }) => {
  return runInTransaction(outerTransaction, async (transaction) => {
    const deleted = await ProfitCache.destroy({
      where: { transaction_id: transactionId },
      transaction,
    });

    return { deleted };
  });
};

exports.getProfitSummary = async () => {
  const rows = await ProfitCache.findAll({
    attributes: [
      [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("created_at")), "month"],
      [Sequelize.fn("SUM", Sequelize.col("total")), "total_profit"],
      [Sequelize.fn("SUM", Sequelize.col("paid_amount")), "total_paid"],
      [Sequelize.fn("SUM", Sequelize.col("operational_cost")), "total_operational"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("created_at"))],
    order: [[Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("created_at")), "ASC"]],
    raw: true,
  });

  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7), // format YYYY-MM
    total_profit: Number(r.total_profit) || 0,
    total_paid: Number(r.total_paid) || 0,
    total_operational: Number(r.total_operational) || 0,
    total_transactions: Number(r.count) || 0,
  }));
};

exports.getCashInSummary = async () => {
  const rows = await TransactionPayment.findAll({
    attributes: [
      [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("paid_at")), "month"],
      [Sequelize.fn("SUM", Sequelize.col("amount")), "total_cash_in"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("paid_at"))],
    order: [[Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("paid_at")), "ASC"]],
    raw: true,
  });

  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7),
    total_cash_in: Number(r.total_cash_in) || 0,
    total_transactions: Number(r.count) || 0,
  }));
};

exports.getTransactionSummary = async () => {
  const rows = await Transaction.findAll({
    attributes: [
      [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("created_at")), "month"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "total_transactions"],
    ],
    where: {
      status: {
        [Op.in]: ["payment", "reporting", "closed"],
      },
    },
    group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("created_at"))],
    order: [[Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("created_at")), "ASC"]],
    raw: true,
  });

  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7),
    total_transactions: Number(r.total_transactions) || 0,
  }));
};

exports.getTransactionSummaryByPaymentMonth = async () => {
  const rows = await TransactionPayment.findAll({
    attributes: [
      [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("paid_at")), "month"],
      [Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("transaction_id"))), "total_transactions"],
    ],
    group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("paid_at"))],
    order: [[Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("paid_at")), "ASC"]],
    raw: true,
  });

  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7),
    total_transactions: Number(r.total_transactions) || 0,
  }));
};

exports.getCashFlowSummary = async ({ year, page = 1, limit = 1 } = {}) => {
  const profit = await exports.getProfitSummary();
  const cashIn = await exports.getCashInSummary();
  const transactions = await exports.getTransactionSummaryByPaymentMonth();

  const summary = {};

  // =========================
  // TRANSACTION (MASTER)
  // =========================
  transactions.forEach((t) => {
    summary[t.month] = {
      month: t.month,
      total_transactions: t.total_transactions,
      total_profit: 0,
      total_cash_in: 0,
    };
  });

  // =========================
  // PROFIT
  // =========================
  profit.forEach((p) => {
    if (!summary[p.month]) {
      summary[p.month] = {
        month: p.month,
        total_transactions: 0,
        total_profit: p.total_profit,
        total_cash_in: 0,
      };
    } else {
      summary[p.month].total_profit = p.total_profit;
    }
  });

  // =========================
  // CASH IN
  // =========================
  cashIn.forEach((c) => {
    if (!summary[c.month]) {
      summary[c.month] = {
        month: c.month,
        total_transactions: 0,
        total_profit: 0,
        total_cash_in: c.total_cash_in,
      };
    } else {
      summary[c.month].total_cash_in = c.total_cash_in;
    }
  });

  // =========================
  // TOTAL CASH FLOW
  // =========================
  Object.keys(summary).forEach((month) => {
    summary[month].total_cash_flow = summary[month].total_profit + summary[month].total_cash_in;
  });

  // =========================
  // CONVERT + SORT
  // =========================
  const rows = Object.values(summary).sort((a, b) => b.month.localeCompare(a.month));

  // GROUP BY YEAR
  const groupedByYear = rows.reduce((acc, item) => {
    const yr = item.month.split("-")[0];
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(item);
    return acc;
  }, {});

  const groupedList = Object.keys(groupedByYear).map((yr) => ({
    year: yr,
    months: groupedByYear[yr],
  }));

  groupedList.sort((a, b) => b.year.localeCompare(a.year));

  let filtered = groupedList;
  if (year) {
    filtered = groupedList.filter((item) => item.year === `${year}`);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  return {
    data: filtered.slice(offset, offset + limit),
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
    },
  };
};

// exports.getMonthlyCashFlowDetail = async (year, month, { page = 1, limit = 10 } = {}) => {
//   if (!year || !month) {
//     throw createError(400, "Year and month are required");
//   }

//   const offset = (page - 1) * limit;

//   // total transaksi bulan tsb
//   const totalCount = await Transaction.count({
//     where: {
//       [Op.and]: [
//         sequelize.where(sequelize.fn("to_char", sequelize.col("Transaction.created_at"), "YYYY-MM"), `${year}-${month}`),
//         {
//           status: {
//             [Op.in]: ["payment", "reporting", "closed"],
//           },
//         },
//       ],
//     },
//   });

//   const rows = await Transaction.findAll({
//     where: {
//       [Op.and]: [
//         sequelize.where(sequelize.fn("to_char", sequelize.col("Transaction.created_at"), "YYYY-MM"), `${year}-${month}`),
//         {
//           status: {
//             [Op.in]: ["payment", "reporting", "closed"],
//           },
//         },
//       ],
//     },
//     attributes: ["id", "trip_code", "customer_name", "customer_phone", "destination", "status", "paid_amount", "outstanding_amount", "start_date", "end_date", "created_at"],
//     include: [
//       {
//         model: TransactionReport,
//         as: "report",
//         attributes: ["total_operational_cost"],
//         required: false,
//       },
//       {
//         model: ProfitCache,
//         as: "profit_cache",
//         attributes: ["total"],
//         required: false,
//       },
//       {
//         association: "vehicle",
//         attributes: ["plate_number", "brand", "model"],
//       },
//       {
//         model: TransactionPayment,
//         as: "payments",
//         required: false,
//       },
//     ],
//     order: [[sequelize.col("Transaction.created_at"), "ASC"]],
//     limit,
//     offset,
//   });

//   const mapped = rows.map((tx) => ({
//     transaction_id: tx.id,
//     trip_code: tx.trip_code,
//     customer_name: tx.customer_name,
//     customer_phone: tx.customer_phone,
//     destination: tx.destination,

//     vehicle: tx.vehicle ? `${tx.vehicle.brand} ${tx.vehicle.model} — ${tx.vehicle.plate_number}` : null,

//     status: tx.status,

//     paid_amount: Number(tx.paid_amount),
//     outstanding_amount: Number(tx.outstanding_amount),

//     operational_cost: Number(tx.report?.total_operational_cost || 0),
//     profit: Number(tx.profit_cache?.total || 0),

//     isClosed: tx.status === "closed",

//     start_date: tx.start_date,
//     end_date: tx.end_date,
//     date: tx.created_at,

//     payments: tx.payments || [],
//   }));

//   return {
//     data: mapped,
//     paginated: mapped.length,
//     meta: {
//       total: totalCount,
//       page: Number(page),
//       limit: Number(limit),
//       totalPages: Math.ceil(totalCount / limit),
//     },
//   };
// };

exports.getMonthlyCashFlowDetail = async (year, month, { page = 1, limit = 10 } = {}) => {
  if (!year || !month) {
    throw createError(400, "Year and month are required");
  }

  const offset = (page - 1) * limit;
  const period = `${year}-${month}`;

  /**
   * =====================================================
   * 1. TOTAL TRANSAKSI (EXISTS — PALING AMAN)
   * =====================================================
   */
  const totalCount = await Transaction.count({
    where: {
      status: {
        [Op.in]: ["payment", "reporting", "closed"],
      },
      [Op.and]: [
        Sequelize.literal(`
          EXISTS (
            SELECT 1
            FROM transaction_payments tp
            WHERE tp.transaction_id = "Transaction"."id"
              AND to_char(tp.paid_at, 'YYYY-MM') = '${period}'
          )
        `),
      ],
    },
  });

  /**
   * =====================================================
   * 2. QUERY DETAIL TRANSACTION
   * =====================================================
   */
  const rows = await Transaction.findAll({
    where: {
      status: {
        [Op.in]: ["payment", "reporting", "closed"],
      },
      [Op.and]: [
        Sequelize.literal(`
          EXISTS (
            SELECT 1
            FROM transaction_payments tp
            WHERE tp.transaction_id = "Transaction"."id"
              AND to_char(tp.paid_at, 'YYYY-MM') = '${period}'
          )
        `),
      ],
    },
    attributes: ["id", "trip_code", "customer_name", "customer_phone", "destination", "status", "paid_amount", "outstanding_amount", "start_date", "end_date", "created_at"],
    include: [
      {
        model: TransactionPayment,
        as: "payments",
        separate: true, // 🔑 FIX alias problem
        where: sequelize.where(sequelize.fn("to_char", sequelize.col("paid_at"), "YYYY-MM"), period),
        attributes: ["id", "paid_at", "method", "amount", "note"],
        order: [["paid_at", "ASC"]],
      },
      {
        model: TransactionReport,
        as: "report",
        attributes: ["total_operational_cost"],
        required: false,
      },
      {
        model: ProfitCache,
        as: "profit_cache",
        attributes: ["total"],
        required: false,
      },
      {
        association: "vehicle",
        attributes: ["plate_number", "brand", "model"],
      },
    ],
    order: [["created_at", "ASC"]],
    limit,
    offset,
  });

  /**
   * =====================================================
   * 3. MAPPING RESPONSE
   * =====================================================
   */
  const data = rows.map((tx) => {
    const paidThisMonth = tx.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      transaction_id: tx.id,
      trip_code: tx.trip_code,
      customer_name: tx.customer_name,
      customer_phone: tx.customer_phone,
      destination: tx.destination,

      vehicle: tx.vehicle ? `${tx.vehicle.brand} ${tx.vehicle.model} — ${tx.vehicle.plate_number}` : null,

      status: tx.status,

      start_date: tx.start_date,
      end_date: tx.end_date,

      paid_amount: Number(tx.paid_amount),
      outstanding_amount: Number(tx.outstanding_amount),
      operational_cost: Number(tx.report?.total_operational_cost || 0),
      profit: Number(tx.profit_cache?.total || 0),

      isClosed: tx.status === "closed",

      start_date: tx.start_date,
      end_date: tx.end_date,
      date: tx.created_at,

      // paid_this_month: paidThisMonth,

      payments: tx.payments.map((p) => ({
        id: p.id,
        paid_at: p.paid_at,
        method: p.method,
        amount: Number(p.amount),
        note: p.note,
      })),
    };
  });

  /**
   * =====================================================
   * 4. RETURN
   * =====================================================
   */
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

exports.getCurrentMonthProfit = async () => {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const currentYear = currentMonth.split("-")[0];

  // pakai summary yang sudah ada
  const result = await exports.getCashFlowSummary({
    year: currentYear,
    page: 1,
    limit: 1,
  });

  if (!result?.data?.length) {
    return {
      month: currentMonth,
      total_transactions: 0,
      total_profit: 0,
      total_cash_in: 0,
      total_cash_flow: 0,
    };
  }

  // cari bulan sekarang
  const yearBlock = result.data[0];
  const monthData = yearBlock.months.find((m) => m.month === currentMonth);

  if (!monthData) {
    return {
      month: currentMonth,
      total_transactions: 0,
      total_profit: 0,
      total_cash_in: 0,
      total_cash_flow: 0,
    };
  }

  return {
    month: monthData.month,
    total_transactions: monthData.total_transactions || 0,
    total_profit: monthData.total_profit || 0,
    total_cash_in: monthData.total_cash_in || 0,
    total_cash_flow: monthData.total_cash_flow || 0,
  };
};

exports.getCashFlowDetailByTransactionId = async (transactionId) => {
  if (!transactionId) {
    throw createError(400, "transaction_id is required");
  }

  const tx = await Transaction.findOne({
    where: { id: transactionId },
    attributes: ["id", "trip_code", "customer_name", "customer_phone", "destination", "status", "paid_amount", "outstanding_amount", "start_date", "end_date"],
    include: [
      {
        model: TransactionPayment,
        as: "payments",
        separate: true, // 🔑 aman dari alias issue
        order: [["paid_at", "ASC"]],
        attributes: ["id", "paid_at", "method", "amount", "note"],
      },
      {
        model: TransactionReport,
        as: "report",
        attributes: ["total_operational_cost"],
        required: false,
      },
      {
        model: ProfitCache,
        as: "profit_cache",
        attributes: ["total"],
        required: false,
      },
      {
        association: "vehicle",
        attributes: ["plate_number", "brand", "model"],
      },
    ],
  });

  if (!tx) {
    throw createError(404, "Transaction not found");
  }

  return {
    data: {
      transaction_id: String(tx.id),
      trip_code: tx.trip_code,
      customer_name: tx.customer_name,
      customer_phone: tx.customer_phone,
      destination: tx.destination,

      vehicle: tx.vehicle ? `${tx.vehicle.brand} ${tx.vehicle.model} — ${tx.vehicle.plate_number}` : null,

      status: tx.status,
      isClosed: tx.status === "closed",

      start_date: tx.start_date,
      end_date: tx.end_date,

      amount_total: Number(tx.paid_amount) + Number(tx.outstanding_amount),
      outstanding_amount: Number(tx.outstanding_amount),

      operational_cost: Number(tx.report?.total_operational_cost || 0),
      profit: Number(tx.profit_cache?.total || 0),

      payments: tx.payments.map((p) => ({
        id: String(p.id),
        paid_at: p.paid_at,
        method: p.method,
        amount: Number(p.amount),
        note: p.note,
      })),
    },
  };
};
