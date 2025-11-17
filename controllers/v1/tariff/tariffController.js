const tariffService = require('@services/v1/tariffs/tariffsServices');

const getStatusCode = (error) => error.status || error.statusCode || 500;

const parseBoolean = (value) => {
	if (value === undefined) return undefined;
	if (typeof value === 'boolean') return value;
	return value === 'true' || value === '1';
};

exports.listTariffs = async (req, res) => {
	try {
		const { code, is_active } = req.query;

		const filters = {};
		if (code) filters.code = code;

		const parsedIsActive = parseBoolean(is_active);
		if (parsedIsActive !== undefined) {
			filters.is_active = parsedIsActive;
		}

		const tariffs = await tariffService.listTariffs({ filters });
		res.status(200).json({ success: true, data: tariffs });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getTariff = async (req, res) => {
	try {
		const { id } = req.params;
		const tariff = await tariffService.getTariffById(id);

		res.status(200).json({ success: true, data: tariff });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createTariff = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const tariff = await tariffService.createTariff({ data: req.body, actorUserId });

		res.status(201).json({ success: true, message: 'Tariff created', data: tariff });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.updateTariff = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		const tariff = await tariffService.updateTariff({ tariffId: id, data: req.body, actorUserId });

		res.status(200).json({ success: true, message: 'Tariff updated', data: tariff });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.deleteTariff = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		await tariffService.deleteTariff({ tariffId: id, actorUserId });

		res.status(200).json({ success: true, message: 'Tariff deleted' });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
