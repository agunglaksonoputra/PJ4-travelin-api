const transactionReportService = require('@services/v1/transactions/transactionReportService');

const getStatusCode = (error) => error.status || error.statusCode || 500;

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
};

exports.listTransactionReports = async (req, res) => {
  try {
    const { transaction_id, report_date } = req.query;

    const filters = {};
    if (transaction_id) filters.transaction_id = transaction_id;
    if (report_date) filters.report_date = report_date;

    const reports = await transactionReportService.listTransactionReports({
      filters,
      includeTransaction: parseBoolean(req.query.includeTransaction),
    });

    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
  }
};

exports.getTransactionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await transactionReportService.getTransactionReportById(id, {
      includeTransaction: parseBoolean(req.query.includeTransaction),
    });

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
  }
};

exports.createTransactionReport = async (req, res) => {
  try {
    const actorUserId = req.user?.id || null;
    const report = await transactionReportService.createTransactionReport({ data: req.body, actorUserId });

    res.status(201).json({ success: true, message: 'Transaction report created', data: report });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
  }
};

exports.updateTransactionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const actorUserId = req.user?.id || null;
    const report = await transactionReportService.updateTransactionReport({ reportId: id, data: req.body, actorUserId });

    res.status(200).json({ success: true, message: 'Transaction report updated', data: report });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
  }
};

exports.deleteTransactionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const actorUserId = req.user?.id || null;
    await transactionReportService.deleteTransactionReport({ reportId: id, actorUserId });

    res.status(200).json({ success: true, message: 'Transaction report deleted' });
  } catch (err) {
    const status = getStatusCode(err);
    res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
  }
};