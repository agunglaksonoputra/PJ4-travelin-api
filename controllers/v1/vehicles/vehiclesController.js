const vehicleService = require('@services/v1/vehicles/vehiclesServices');

const getStatusCode = (error) => error.status || error.statusCode || 500;

exports.listVehicles = async (req, res) => {
	try {
		const vehicles = await vehicleService.listVehicles({ filters: req.query });

		res.status(200).json({ success: true, data: vehicles });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getVehicle = async (req, res) => {
	try {
		const { id } = req.params;
		const vehicle = await vehicleService.getVehicleById(id);

		res.status(200).json({ success: true, data: vehicle });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createVehicle = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const vehicle = await vehicleService.createVehicle({ data: req.body, actorUserId });

		res.status(201).json({ success: true, message: 'Vehicle created', data: vehicle });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.updateVehicle = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		const vehicle = await vehicleService.updateVehicle({ vehicleId: id, data: req.body, actorUserId });

		res.status(200).json({ success: true, message: 'Vehicle updated', data: vehicle });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.deleteVehicle = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		await vehicleService.deleteVehicle({ vehicleId: id, actorUserId });

		res.status(200).json({ success: true, message: 'Vehicle deleted' });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
