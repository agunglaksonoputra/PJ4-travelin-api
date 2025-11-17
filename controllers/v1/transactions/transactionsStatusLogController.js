const transactionStatusLogService = require('@services/v1/transactions/transactionsStatusLogsServices');

const buildCreatePayload = (body, actorUserId) => {
	const transactionId = body.transactionId ?? body.transaction_id;
	const fromStatus = body.fromStatus ?? body.from_status ?? null;
	const toStatus = body.toStatus ?? body.to_status;
	const changedAt = body.changedAt ?? body.changed_at;

	return {
		transactionId,
		fromStatus,
		toStatus,
		note: body.note ?? null,
		changedAt,
		actorUserId,
	};
};

const sendErrorResponse = (res, err) => {
	const statusCode = err?.status || err?.statusCode || 500;
	res.status(statusCode).json({ success: false, error: err?.message || 'Terjadi kesalahan' });
};

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
		sendErrorResponse(res, err);
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
		sendErrorResponse(res, err);
	}
};

exports.createTransactionStatusLog = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const payload = buildCreatePayload(req.body ?? {}, actorUserId);
		const log = await transactionStatusLogService.createTransactionStatusLog(payload);

		res.status(201).json({ success: true, message: 'Transaction status log created', data: log });
	} catch (err) {
		sendErrorResponse(res, err);
	}
};
