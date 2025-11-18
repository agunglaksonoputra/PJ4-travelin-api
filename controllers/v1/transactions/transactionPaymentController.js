const transactionPaymentService = require('@services/v1/transactions/transactionPaymentServices');

const getStatusCode = (error) => error.status || error.statusCode || 500;

const parseBoolean = (value) => {
	if (value === undefined) return undefined;
	if (typeof value === 'boolean') return value;
	return value === 'true' || value === '1';
};

exports.listTransactionPayments = async (req, res) => {
	try {
		const { transaction_id, method } = req.query;

		const filters = {};
		if (transaction_id) filters.transaction_id = transaction_id;
		if (method) filters.method = method;

		const payments = await transactionPaymentService.listTransactionPayments({
			filters,
			includeTransaction: parseBoolean(req.query.includeTransaction),
		});

		res.status(200).json({ success: true, data: payments });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getTransactionPayment = async (req, res) => {
	try {
		const { id } = req.params;
		const payment = await transactionPaymentService.getTransactionPaymentById(id, {
			includeTransaction: parseBoolean(req.query.includeTransaction),
		});

		res.status(200).json({ success: true, data: payment });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createTransactionPayment = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const payment = await transactionPaymentService.createTransactionPayment({ data: req.body, actorUserId });

		res.status(201).json({ success: true, message: 'Transaction payment created', data: payment });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.updateTransactionPayment = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		const payment = await transactionPaymentService.updateTransactionPayment({ paymentId: id, data: req.body, actorUserId });

		res.status(200).json({ success: true, message: 'Transaction payment updated', data: payment });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.deleteTransactionPayment = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		await transactionPaymentService.deleteTransactionPayment({ paymentId: id, actorUserId });

		res.status(200).json({ success: true, message: 'Transaction payment deleted' });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
