const transactionService = require('@services/v1/transactions/transactionsServices');

const getStatusCode = (error) => error.status || error.statusCode || 500;

const parseInteger = (value) => {
	if (value === undefined) return undefined;
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? undefined : parsed;
};

exports.listTransactions = async (req, res) => {
	try {
		const { status, trip_code, vehicle_id, tariff_id, customer_name } = req.query;

		const filters = {};
		if (status) filters.status = status;
		if (trip_code) filters.trip_code = trip_code;
		if (vehicle_id) filters.vehicle_id = parseInteger(vehicle_id);
		if (tariff_id) filters.tariff_id = parseInteger(tariff_id);
		if (customer_name) filters.customer_name = customer_name;

		const transactions = await transactionService.listTransactions({ filters });

		res.status(200).json({ success: true, data: transactions });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getTransaction = async (req, res) => {
	try {
		const { id } = req.params;
		const transaction = await transactionService.getTransactionById(id);

		res.status(200).json({ success: true, data: transaction });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createTransaction = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const transaction = await transactionService.createTransaction({ data: req.body, actorUserId });

		res.status(201).json({ success: true, message: 'Transaction created', data: transaction });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.updateTransaction = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		const transaction = await transactionService.updateTransaction({ transactionId: id, data: req.body, actorUserId });

		res.status(200).json({ success: true, message: 'Transaction updated', data: transaction });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.deleteTransaction = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		await transactionService.deleteTransaction({ transactionId: id, actorUserId });

		res.status(200).json({ success: true, message: 'Transaction deleted' });
	} catch (err) {
		const statusCode = getStatusCode(err);
		res.status(statusCode).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
