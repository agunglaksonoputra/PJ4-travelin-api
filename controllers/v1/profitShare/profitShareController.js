const profitShareService = require('@services/v1/profitShare/profitShareService');

const getStatusCode = (error) => error.status || error.statusCode || 500;

const parseBool = (v) => {
	if (v === undefined) return undefined;
	if (typeof v === 'boolean') return v;
	return v === 'true' || v === '1';
};

exports.listProfitShares = async (req, res) => {
	try {
		const { transaction_id, owner_id, include_transaction, include_owner } = req.query;

		const filters = {};
		if (transaction_id) filters.transaction_id = transaction_id;
		if (owner_id) filters.owner_id = owner_id;

		const includeTransaction = parseBool(include_transaction) || false;
		const includeOwner = parseBool(include_owner) || false;

		const rows = await profitShareService.listProfitShares({
			filters,
			includeTransaction,
			includeOwner,
		});
		res.status(200).json({ success: true, data: rows });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getProfitShare = async (req, res) => {
	try {
		const { id } = req.params;
		const includeTransaction = parseBool(req.query.include_transaction) || false;
		const includeOwner = parseBool(req.query.include_owner) || false;

		const row = await profitShareService.getProfitShareById(id, { includeTransaction, includeOwner });
		res.status(200).json({ success: true, data: row });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createProfitShare = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const row = await profitShareService.createProfitShare({ data: req.body, actorUserId });
		res.status(201).json({ success: true, message: 'Profit share created', data: row });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.updateProfitShare = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		const row = await profitShareService.updateProfitShare({ profitShareId: id, data: req.body, actorUserId });
		res.status(200).json({ success: true, message: 'Profit share updated', data: row });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.deleteProfitShare = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		await profitShareService.deleteProfitShare({ profitShareId: id, actorUserId });
		res.status(200).json({ success: true, message: 'Profit share deleted' });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

