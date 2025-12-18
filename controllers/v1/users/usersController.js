const userService = require('@services/v1/users/usersServices');

const getStatusCode = (error) => error.status || error.statusCode || 500;

exports.listUsers = async (req, res) => {
	try {
		const users = await userService.listUsers({ filters: req.query });

		res.status(200).json({ success: true, data: users });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getUser = async (req, res) => {
	try {
		const { id } = req.params;
		const user = await userService.getUserById(id);

		res.status(200).json({ success: true, data: user });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.createUser = async (req, res) => {
	try {
		const actorUserId = req.user?.id || null;
		const user = await userService.createUser({ data: req.body, actorUserId });

		res.status(201).json({ success: true, message: 'User created', data: user });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		const user = await userService.updateUser({ userId: id, data: req.body, actorUserId });

		res.status(200).json({ success: true, message: 'User updated', data: user });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.deleteUser = async (req, res) => {
	try {
		const { id } = req.params;
		const actorUserId = req.user?.id || null;
		await userService.deleteUser({ userId: id, actorUserId });

		res.status(200).json({ success: true, message: 'User deleted' });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
