const ownerWithdrawalService = require('@services/v1/owners/ownerWithdrawalServices');

const getStatusCode = (error) => error.status || error.statusCode || 500;

exports.listOwnerWithdrawals = async (req, res) => {
	try {
		const { owner_id, method } = req.query;

		const filters = {};
		if (owner_id) filters.owner_id = owner_id;
		if (method) filters.method = method;

		const withdrawals = await ownerWithdrawalService.listOwnerWithdrawals({ filters });

		res.status(200).json({ success: true, data: withdrawals });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getOwnerWithdrawal = async (req, res) => {
	try {
		const { id } = req.params;
		const withdrawal = await ownerWithdrawalService.getOwnerWithdrawalById(id);

		res.status(200).json({ success: true, data: withdrawal });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createOwnerWithdrawal = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const withdrawal = await ownerWithdrawalService.createOwnerWithdrawal({ data: req.body, actorUserId });

		res.status(201).json({ success: true, message: 'Owner withdrawal created', data: withdrawal });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.updateOwnerWithdrawal = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		const withdrawal = await ownerWithdrawalService.updateOwnerWithdrawal({ withdrawalId: id, data: req.body, actorUserId });

		res.status(200).json({ success: true, message: 'Owner withdrawal updated', data: withdrawal });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.deleteOwnerWithdrawal = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		await ownerWithdrawalService.deleteOwnerWithdrawal({ withdrawalId: id, actorUserId });

		res.status(200).json({ success: true, message: 'Owner withdrawal deleted' });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
