const createError = require("http-errors");
const { ProfitCache, Transaction, TransactionReport, TransactionPayment, Vehicle, sequelize } = require("@models");
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
  const rows = await Transaction.findAll({
    attributes: [
      [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("created_at")), "month"],
      [Sequelize.fn("SUM", Sequelize.col("paid_amount")), "total_cash_in"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    // where: {
    //   status: {
    //     [Sequelize.Op.not]: "closed", // NOT closed = deposit
    //   },
    // },
    where: {
      status: {
        [Sequelize.Op.in]: ["payment"],
      },
    },
    group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("created_at"))],
    raw: true,
  });

  return rows.map((r) => ({
    month: r.month.toISOString().slice(0, 7),
    total_cash_in: Number(r.total_cash_in) || 0,
    total_transactions: Number(r.count) || 0,
  }));
};

exports.getCashFlowSummary = async ({ year, page = 1, limit = 1 } = {}) => {
  const profit = await exports.getProfitSummary();
  const cashIn = await exports.getCashInSummary();

  const summary = {};

  // Merge profit rows
  profit.forEach((p) => {
    summary[p.month] = {
      month: p.month,
      total_transactions: p.total_transactions || 0,
      total_profit: p.total_profit,
      total_cash_in: 0,
    };
  });

  // Merge cash-in rows
  cashIn.forEach((c) => {
    if (!summary[c.month]) {
      summary[c.month] = {
        month: c.month,
        total_transactions: c.total_transactions || 0,
        total_profit: 0,
        total_cash_in: c.total_cash_in,
      };
    } else {
      summary[c.month].total_cash_in = c.total_cash_in;
      summary[c.month].total_transactions += c.total_transactions || 0;
    }
  });

  // add total cash flow
  Object.keys(summary).forEach((month) => {
    summary[month].total_cash_flow = summary[month].total_profit + summary[month].total_cash_in;
  });

  // convert to array
  const rows = Object.values(summary);

  // sort by month
  rows.sort((a, b) => b.month.localeCompare(a.month));

  // Group by year
  const groupedByYear = rows.reduce((acc, item) => {
    const yr = item.month.split("-")[0];
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(item);
    return acc;
  }, {});

  // convert: { "2025": [...], "2024": [...] } → array form
  const groupedList = Object.keys(groupedByYear).map((yr) => ({
    year: yr,
    months: groupedByYear[yr],
  }));

  // sort by year ASC
  groupedList.sort((a, b) => b.year.localeCompare(a.year));

  // FILTER by year
  let filtered = groupedList;
  if (year) {
    filtered = groupedList.filter((item) => item.year === `${year}`);
  }

  // PAGINATION (1 page = 1 year set)
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const paginated = filtered.slice(offset, offset + limit);

  return {
    data: paginated,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
    },
  };
};

exports.getMonthlyCashFlowDetail = async (year, month, { page = 1, limit = 10 } = {}) => {
  if (!year || !month) {
    throw createError(400, "Year and month are required");
  }

  const offset = (page - 1) * limit;

  // total transaksi bulan tsb
  const totalCount = await Transaction.count({
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("to_char", sequelize.col("Transaction.created_at"), "YYYY-MM"), `${year}-${month}`),
        {
          status: {
            [Op.in]: ["payment", "reporting", "closed"],
          },
        },
      ],
    },
  });

  const rows = await Transaction.findAll({
    where: {
      [Op.and]: [
        sequelize.where(sequelize.fn("to_char", sequelize.col("Transaction.created_at"), "YYYY-MM"), `${year}-${month}`),
        {
          status: {
            [Op.in]: ["payment", "reporting", "closed"],
          },
        },
      ],
    },
    attributes: ["id", "trip_code", "customer_name", "customer_phone", "destination", "status", "paid_amount", "outstanding_amount", "start_date", "end_date", "created_at"],
    include: [
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
      {
        model: TransactionPayment,
        as: "payments",
        required: false,
      },
    ],
    order: [[sequelize.col("Transaction.created_at"), "ASC"]],
    limit,
    offset,
  });

  const mapped = rows.map((tx) => ({
    transaction_id: tx.id,
    trip_code: tx.trip_code,
    customer_name: tx.customer_name,
    customer_phone: tx.customer_phone,
    destination: tx.destination,

    vehicle: tx.vehicle ? `${tx.vehicle.brand} ${tx.vehicle.model} — ${tx.vehicle.plate_number}` : null,

    status: tx.status,

    paid_amount: Number(tx.paid_amount),
    outstanding_amount: Number(tx.outstanding_amount),

    operational_cost: Number(tx.report?.total_operational_cost || 0),
    profit: Number(tx.profit_cache?.total || 0),

    isClosed: tx.status === "closed",

    start_date: tx.start_date,
    end_date: tx.end_date,
    date: tx.created_at,

    payments: tx.payments || [],
  }));

  return {
    data: mapped,
    paginated: mapped.length,
    meta: {
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};
