const createError = require('http-errors');
const { TransactionReport, sequelize } = require('@models');
const { createActivityLog } = require('../activityLogs/activityLogsServices');

const ENTITY_TYPE = 'transaction_report';

const runInTransaction = async (outerTransaction, handler) => {
  if (outerTransaction) {
    return handler(outerTransaction);
  }

  return sequelize.transaction(handler);
};

exports.listTransactionReports = async ({
  filters = {},
  includeTransaction = false,
  options = {},
} = {}) => {
  const { where = {}, ...rest } = options;
  const query = {
    where: { ...where, ...filters },
    ...rest,
  };

  if (includeTransaction) {
    query.include = [{ association: 'transaction' }];
  }

  return TransactionReport.findAll(query);
};

exports.getTransactionReportById = async (reportId, { includeTransaction = false } = {}) => {
  const query = {};

  if (includeTransaction) {
    query.include = [{ association: 'transaction' }];
  }

  const report = await TransactionReport.findByPk(reportId, query);

  if (!report) {
    throw createError(404, 'Transaction report not found');
  }

  return report;
};

exports.createTransactionReport = async ({ data, actorUserId, transaction: outerTransaction }) => {
  if (!data?.transaction_id) {
    throw createError(400, 'transaction_id is required');
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const report = await TransactionReport.create(data, { transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: report.id,
      action: 'create',
      message: `Transaction report ${report.id} created for transaction ${report.transaction_id}`,
      meta: { payload: data },
      transaction,
    });

    return report;
  });
};

exports.updateTransactionReport = async ({ reportId, data, actorUserId, transaction: outerTransaction }) => {
  if (!data || Object.keys(data).length === 0) {
    throw createError(400, 'Update payload is empty');
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const report = await TransactionReport.findByPk(reportId, { transaction });

    if (!report) {
      throw createError(404, 'Transaction report not found');
    }

    const before = report.toJSON();
    await report.update(data, { transaction });
    const after = report.toJSON();

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: report.id,
      action: 'update',
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
      throw createError(404, 'Transaction report not found');
    }

    const archive = report.toJSON();
    await report.destroy({ transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: reportId,
      action: 'delete',
      message: `Transaction report ${reportId} deleted`,
      meta: { before: archive },
      transaction,
    });
  });
};