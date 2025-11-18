const ownerService = require('@services/v1/owners/ownerServices');

const getStatusCode = (error) => error.status || error.statusCode || 500;

exports.listOwners = async (req, res) => {
	try {
		const { name, phone } = req.query;
		const sharesPercentage = req.query.shares_percentage;

		const filters = {};
		if (name) filters.name = name;
		if (phone) filters.phone = phone;
		if (sharesPercentage !== undefined) filters.shares_percentage = sharesPercentage;

		const owners = await ownerService.listOwners({ filters });
		res.status(200).json({ success: true, data: owners });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getOwner = async (req, res) => {
	try {
		const { id } = req.params;
		const owner = await ownerService.getOwnerById(id);

		res.status(200).json({ success: true, data: owner });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createOwner = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const owner = await ownerService.createOwner({ data: req.body, actorUserId });

		res.status(201).json({ success: true, message: 'Owner created', data: owner });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.updateOwner = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		const owner = await ownerService.updateOwner({ ownerId: id, data: req.body, actorUserId });

		res.status(200).json({ success: true, message: 'Owner updated', data: owner });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.deleteOwner = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		await ownerService.deleteOwner({ ownerId: id, actorUserId });

		res.status(200).json({ success: true, message: 'Owner deleted' });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
