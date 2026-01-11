const createError = require("http-errors");
const { TransactionPayment, Transaction, sequelize } = require("@models");
const { createTransactionStatusLog } = require("./transactionsStatusLogsServices");
const { createActivityLog } = require("../activityLogs/activityLogsServices");

const ENTITY_TYPE = "transaction_payment";

const runInTransaction = async (outerTransaction, handler) => {
  if (outerTransaction) {
    return handler(outerTransaction);
  }

  return sequelize.transaction(handler);
};

const recalculateTransactionPaymentSummary = async ({ transactionId, transaction }) => {
  if (!transactionId) return;

  const transactionRecord = await Transaction.findByPk(transactionId, { transaction });
  if (!transactionRecord) return;

  const [result] = await TransactionPayment.findAll({
    attributes: [[sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("amount")), 0), "total_paid"]],
    where: { transaction_id: transactionId },
    transaction,
    raw: true,
  });

  const totalPaid = Number(result?.total_paid || 0);
  const totalCost = Number(transactionRecord.total_cost || 0);
  const outstandingRaw = totalCost - totalPaid;
  const outstandingAmount = outstandingRaw > 0 ? Number(outstandingRaw.toFixed(2)) : 0;

  await transactionRecord.update(
    {
      paid_amount: Number(totalPaid.toFixed(2)),
      outstanding_amount: outstandingAmount,
    },
    { transaction }
  );
};

// If the transaction is fully paid, move status to 'reporting'
const setStatusReportingIfPaidOff = async ({ transactionRecord, actorUserId, transaction }) => {
  if (!transactionRecord) return;

  const currentStatus = String(transactionRecord.status || "").toLowerCase();
  const outstanding = Number(transactionRecord.outstanding_amount || 0);

  // Only auto-progress from 'payment' to 'reporting' when fully paid
  if (currentStatus === "payment" && outstanding === 0) {
    const before = transactionRecord.toJSON();
    await transactionRecord.update({ status: "reporting" }, { transaction });
    const after = transactionRecord.toJSON();

    // Write status log
    await createTransactionStatusLog({
      transactionId: transactionRecord.id,
      fromStatus: before.status,
      toStatus: "reporting",
      note: "Auto-set to reporting when payment fully settled",
      actorUserId,
      transaction,
    });

    // Also add activity log for visibility
    await createActivityLog({
      actorUserId,
      entityType: "transaction",
      entityId: transactionRecord.id,
      action: "update",
      message: `Transaction ${transactionRecord.trip_code} status auto-updated to reporting`,
      meta: { before, after },
      transaction,
    });
  }
};

exports.listTransactionPayments = async ({ filters = {}, includeTransaction = false, options = {}, includeDeleted = false } = {}) => {
  const { where = {}, ...rest } = options;
  const query = {
    where: { ...where, ...filters },
    ...rest,
  };

  if (includeDeleted) {
    query.paranoid = false;
  }

  if (includeTransaction) {
    query.include = [{ association: "transaction" }];
  }

  return TransactionPayment.findAll(query);
};

exports.listTransactionPaymentsByVehicle = async ({ vehicleId, includeTransaction = false, options = {}, includeDeleted = false, onlyPaymentStatus = true } = {}) => {
  if (!vehicleId) {
    throw createError(400, "vehicleId is required");
  }

  const { where = {}, include = [], ...rest } = options;
  const query = {
    where,
    include: [
      {
        association: "transaction",
        where: {
          vehicle_id: vehicleId,
          // Hanya tampilkan transaksi yang masih berada di status payment (default)
          ...(onlyPaymentStatus ? { status: "payment" } : {}),
        },
        required: true,
      },
      ...include,
    ],
    ...rest,
  };

  if (includeDeleted) {
    query.paranoid = false;
  }

  if (!includeTransaction) {
    query.include = query.include.map((relation) => {
      if (relation.association === "transaction") {
        return { ...relation, attributes: [] };
      }
      return relation;
    });
  }

  return TransactionPayment.findAll(query);
};

exports.getTransactionPaymentById = async (paymentId, { includeTransaction = false } = {}) => {
  const query = {};

  if (includeTransaction) {
    query.include = [{ association: "transaction" }];
  }

  const payment = await TransactionPayment.findByPk(paymentId, query);

  if (!payment) {
    throw createError(404, "Transaction payment not found");
  }

  return payment;
};

exports.createTransactionPayment = async ({ data, actorUserId, transaction: outerTransaction }) => {
  if (!data?.transaction_id) {
    throw createError(400, "transaction_id is required");
  }

  if (data.amount === undefined || data.amount === null) {
    throw createError(400, "amount is required");
  }

  if (!data?.method) {
    throw createError(400, "method is required");
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const payment = await TransactionPayment.create(data, { transaction });

    await recalculateTransactionPaymentSummary({
      transactionId: payment.transaction_id,
      transaction,
    });

    // Fetch updated transaction and set status to 'reporting' if fully paid
    const trx = await Transaction.findByPk(payment.transaction_id, { transaction });
    await syncTransactionStatusByPayment({ transactionRecord: trx, actorUserId, transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: payment.id,
      action: "create",
      message: `Transaction payment ${payment.id} created for transaction ${payment.transaction_id}`,
      meta: { payload: data },
      transaction,
    });

    return payment;
  });
};

exports.updateTransactionPayment = async ({ paymentId, data, actorUserId, transaction: outerTransaction }) => {
  if (!data || Object.keys(data).length === 0) {
    throw createError(400, "Update payload is empty");
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const payment = await TransactionPayment.findByPk(paymentId, { transaction });

    if (!payment) {
      throw createError(404, "Transaction payment not found");
    }

    const before = payment.toJSON();
    await payment.update(data, { transaction });
    const after = payment.toJSON();

    await recalculateTransactionPaymentSummary({
      transactionId: payment.transaction_id,
      transaction,
    });

    const trx = await Transaction.findByPk(payment.transaction_id, { transaction });
    await syncTransactionStatusByPayment({ transactionRecord: trx, actorUserId, transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: payment.id,
      action: "update",
      message: `Transaction payment ${payment.id} updated`,
      meta: { before, after },
      transaction,
    });

    return payment;
  });
};

const syncTransactionStatusByPayment = async ({ transactionRecord, actorUserId, transaction }) => {
  if (!transactionRecord) return;

  const outstanding = Number(transactionRecord.outstanding_amount || 0);
  const currentStatus = String(transactionRecord.status || "").toLowerCase();

  let targetStatus = currentStatus;

  if (outstanding === 0) {
    targetStatus = "reporting";
  } else {
    targetStatus = "payment";
  }

  // Tidak perlu update jika status sama
  if (targetStatus === currentStatus) return;

  const before = transactionRecord.toJSON();
  await transactionRecord.update({ status: targetStatus }, { transaction });
  const after = transactionRecord.toJSON();

  // Status log
  await createTransactionStatusLog({
    transactionId: transactionRecord.id,
    fromStatus: before.status,
    toStatus: targetStatus,
    note: targetStatus === "reporting" ? "Auto-set to reporting when fully paid" : "Auto-set back to payment due to outstanding balance",
    actorUserId,
    transaction,
  });

  // Activity log
  await createActivityLog({
    actorUserId,
    entityType: "transaction",
    entityId: transactionRecord.id,
    action: "update",
    message: `Transaction ${transactionRecord.trip_code} status auto-updated to ${targetStatus}`,
    meta: { before, after },
    transaction,
  });
};

exports.deleteTransactionPayment = async ({ paymentId, actorUserId, transaction: outerTransaction }) => {
  return runInTransaction(outerTransaction, async (transaction) => {
    const payment = await TransactionPayment.findByPk(paymentId, { transaction });

    if (!payment) {
      throw createError(404, "Transaction payment not found");
    }

    const archive = payment.toJSON();
    await payment.destroy({ transaction });

    await recalculateTransactionPaymentSummary({
      transactionId: payment.transaction_id,
      transaction,
    });

    const trx = await Transaction.findByPk(payment.transaction_id, { transaction });
    await setStatusReportingIfPaidOff({ transactionRecord: trx, actorUserId, transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: paymentId,
      action: "delete",
      message: `Transaction payment ${paymentId} deleted`,
      meta: { before: archive },
      transaction,
    });
  });
};
