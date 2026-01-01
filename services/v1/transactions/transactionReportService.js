const createError = require("http-errors");
const { TransactionReport, Transaction, sequelize } = require("@models");
const { createActivityLog } = require("../activityLogs/activityLogsServices");
const { createTransactionStatusLog } = require("./transactionsStatusLogsServices");
const { updateProfitCache } = require("@services/v1/monthlyReport/monthlyReportServices");

const ENTITY_TYPE = "transaction_report";

const calculateTotalOperationalCost = (data) => {
  const driverFee = Number(data.driver_fee) || 0;
  const gasolineCost = Number(data.gasoline_cost) || 0;
  const tollCost = Number(data.toll_cost) || 0;
  const parkingCost = Number(data.parking_cost) || 0;
  const miscCost = Number(data.misc_cost) || 0;

  return driverFee + gasolineCost + tollCost + parkingCost + miscCost;
};

const runInTransaction = async (outerTransaction, handler) => {
  if (outerTransaction) {
    return handler(outerTransaction);
  }

  return sequelize.transaction(handler);
};

exports.listTransactionReports = async ({ filters = {}, includeTransaction = false, options = {} } = {}) => {
  const { where = {}, ...rest } = options;
  const query = {
    where: { ...where, ...filters },
    ...rest,
  };

  if (includeTransaction) {
    query.include = [{ association: "transaction" }];
  }

  return TransactionReport.findAll(query);
};

exports.getTransactionReportById = async (reportId, { includeTransaction = false } = {}) => {
  const query = {};

  if (includeTransaction) {
    query.include = [{ association: "transaction" }];
  }

  const report = await TransactionReport.findByPk(reportId, query);

  if (!report) {
    throw createError(404, "Transaction report not found");
  }

  return report;
};

exports.createTransactionReport = async ({ data, actorUserId, transaction: outerTransaction }) => {
  if (!data?.transaction_id) {
    throw createError(400, "transaction_id is required");
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const txRecord = await Transaction.findByPk(data.transaction_id, { transaction });
    if (!txRecord) {
      throw createError(404, "Transaction not found");
    }

    data.total_operational_cost = calculateTotalOperationalCost(data);

    const report = await TransactionReport.create(data, { transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: report.id,
      action: "create",
      message: `Transaction report ${report.id} created for transaction ${report.transaction_id}`,
      meta: { payload: data },
      transaction,
    });

    const previousStatus = txRecord.status;
    await txRecord.update({ status: "closed" }, { transaction });

    if (previousStatus !== "closed") {
      await createTransactionStatusLog({
        transactionId: data.transaction_id,
        fromStatus: previousStatus,
        toStatus: "closed",
        note: "Status changed to closed after report creation",
        actorUserId,
        transaction,
      });

      await updateProfitCache(txRecord.id, { transaction });

      await createActivityLog({
        actorUserId,
        entityType: "transaction",
        entityId: data.transaction_id,
        action: "update",
        message: `Transaction status updated from ${previousStatus} to closed due to report creation`,
        meta: { reportId: report.id, fromStatus: previousStatus, toStatus: "closed" },
        transaction,
      });
    }

    return report;
  });
};

exports.updateTransactionReport = async ({ reportId, data, actorUserId, transaction: outerTransaction }) => {
  if (!data || Object.keys(data).length === 0) {
    throw createError(400, "Update payload is empty");
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const report = await TransactionReport.findByPk(reportId, { transaction });

    if (!report) {
      throw createError(404, "Transaction report not found");
    }

    const costFields = ["driver_fee", "gasoline_cost", "toll_cost", "parking_cost", "misc_cost"];
    const hasCostFieldUpdate = costFields.some((field) => data.hasOwnProperty(field));

    if (hasCostFieldUpdate) {
      const mergedData = {
        driver_fee: data.driver_fee !== undefined ? data.driver_fee : report.driver_fee,
        gasoline_cost: data.gasoline_cost !== undefined ? data.gasoline_cost : report.gasoline_cost,
        toll_cost: data.toll_cost !== undefined ? data.toll_cost : report.toll_cost,
        parking_cost: data.parking_cost !== undefined ? data.parking_cost : report.parking_cost,
        misc_cost: data.misc_cost !== undefined ? data.misc_cost : report.misc_cost,
      };
      data.total_operational_cost = calculateTotalOperationalCost(mergedData);
    }

    const before = report.toJSON();
    await report.update(data, { transaction });
    const after = report.toJSON();

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: report.id,
      action: "update",
      message: `Transaction report ${report.id} updated`,
      meta: { before, after },
      transaction,
    });

    return report;
  });
};

exports.deleteTransactionReport = async ({ reportId, actorUserId, transaction: outerTransaction }) => {
  return runInTransaction(outerTransaction, async (transaction) => {
    const report = await TransactionReport.findByPk(reportId, { transaction });

    if (!report) {
      throw createError(404, "Transaction report not found");
    }

    const archive = report.toJSON();
    await report.destroy({ transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: reportId,
      action: "delete",
      message: `Transaction report ${reportId} deleted`,
      meta: { before: archive },
      transaction,
    });
  });
};

exports.getTotalOperationalCostByTransaction = async (transactionId) => {
  if (!transactionId) {
    throw createError(400, "transaction_id is required");
  }

  const report = await TransactionReport.findOne({
    where: { transaction_id: transactionId },
    attributes: ["id", "transaction_id", "total_operational_cost"],
    include: [
      {
        association: "transaction",
        attributes: ["id", "vehicle_name", "status"],
      },
    ],
  });

  if (!report) {
    throw createError(404, "Transaction report not found for this transaction");
  }

  return {
    transaction_id: report.transaction_id,
    report_id: report.id,
    vehicle_name: report.transaction?.vehicle_name,
    status: report.transaction?.status,
    total_operational_cost: parseFloat(report.total_operational_cost) || 0,
  };
};

exports.getTotalOperationalCostOverall = async ({ filters = {} } = {}) => {
  const { Sequelize } = require("sequelize");

  const whereClause = { ...filters };

  const result = await TransactionReport.findOne({
    attributes: [
      [Sequelize.fn("SUM", Sequelize.col("total_operational_cost")), "total"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      [Sequelize.fn("AVG", Sequelize.col("total_operational_cost")), "average"],
    ],
    where: whereClause,
    raw: true,
  });

  const total = parseFloat(result?.total) || 0;
  const count = parseInt(result?.count) || 0;
  const average = parseFloat(result?.average) || 0;

  return {
    total_operational_cost: total,
    total_reports: count,
    average_operational_cost: average,
  };
};
