const transactionRefundService = require('@services/v1/transactions/transactionRefundService');

const getStatusCode = (error) => error.status || error.statusCode || 500;

const parseBoolean = (value) => {
	if (value === undefined) return undefined;
	if (typeof value === 'boolean') return value;
	return value === 'true' || value === '1';
};

exports.listTransactionRefunds = async (req, res) => {
	try {
		const { transaction_id, status } = req.query;

		const filters = {};
		if (transaction_id) filters.transaction_id = transaction_id;
		if (status) filters.status = status;

		const refunds = await transactionRefundService.listTransactionRefunds({
			filters,
			includeTransaction: parseBoolean(req.query.includeTransaction),
		});

		res.status(200).json({ success: true, data: refunds });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getTransactionRefund = async (req, res) => {
	try {
		const { id } = req.params;
		const refund = await transactionRefundService.getTransactionRefundById(id, {
			includeTransaction: parseBoolean(req.query.includeTransaction),
		});

		res.status(200).json({ success: true, data: refund });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createTransactionRefund = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const refund = await transactionRefundService.createTransactionRefund({ data: req.body, actorUserId });

		res.status(201).json({ success: true, message: 'Transaction refund created', data: refund });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.updateTransactionRefund = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		const refund = await transactionRefundService.updateTransactionRefund({ refundId: id, data: req.body, actorUserId });

		res.status(200).json({ success: true, message: 'Transaction refund updated', data: refund });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.deleteTransactionRefund = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		await transactionRefundService.deleteTransactionRefund({ refundId: id, actorUserId });

		res.status(200).json({ success: true, message: 'Transaction refund deleted' });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
