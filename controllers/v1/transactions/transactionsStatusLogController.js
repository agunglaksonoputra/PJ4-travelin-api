const transactionStatusLogService = require('@services/v1/transactions/transactionsStatusLogsServices');

const getStatusCode = (error) => error.status || error.statusCode || 500;

const parseBoolean = (value) => {
	if (value === undefined) return undefined;
	if (typeof value === 'boolean') return value;
	return value === 'true' || value === '1';
};

exports.listTransactionStatusLogs = async (req, res) => {
	try {
		const { transaction_id, to_status, changed_by } = req.query;

		const filters = {};
		if (transaction_id) filters.transaction_id = transaction_id;
		if (to_status) filters.to_status = to_status;
		if (changed_by) filters.changed_by = changed_by;

		const includeChanger = parseBoolean(req.query.includeChanger);
		const includeTransaction = parseBoolean(req.query.includeTransaction);

		const logs = await transactionStatusLogService.listTransactionStatusLogs({
			filters,
			includeChanger,
			includeTransaction,
		});

		res.status(200).json({ success: true, data: logs });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getTransactionStatusLog = async (req, res) => {
	try {
		const { id } = req.params;
		const includeChanger = parseBoolean(req.query.includeChanger);
		const includeTransaction = parseBoolean(req.query.includeTransaction);

		const log = await transactionStatusLogService.getTransactionStatusLogById(id, {
			includeChanger,
			includeTransaction,
		});

		res.status(200).json({ success: true, data: log });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createTransactionStatusLog = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const log = await transactionStatusLogService.createTransactionStatusLog({
			...req.body,
			actorUserId,
		});

		res.status(201).json({ success: true, message: 'Transaction status log created', data: log });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
