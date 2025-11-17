const createError = require('http-errors');
const activityLogService = require('@services/v1/activityLogs/activityLogsServices');

const getStatusCode = (error) => error.status || error.statusCode || 500;

const parseBoolean = (value, defaultValue = false) => {
	if (value === undefined) return defaultValue;

	if (typeof value === 'boolean') {
		return value;
	}

	return value === 'true' || value === '1';
};

const parseInteger = (value, defaultValue) => {
	if (value === undefined) return defaultValue;

	const parsed = Number.parseInt(value, 10);

	if (Number.isNaN(parsed) || parsed < 0) {
		return defaultValue;
	}

	return parsed;
};

exports.listActivityLogs = async (req, res) => {
	try {
		const { actorUserId, entityType, entityId, action } = req.query;

		const filters = {};
		if (actorUserId) filters.actor_user_id = actorUserId;
		if (entityType) filters.entity_type = entityType;
		if (entityId) filters.entity_id = entityId;
		if (action) filters.action = action;

		const logs = await activityLogService.getActivityLogs({
			filters,
			includeActor: parseBoolean(req.query.includeActor),
			limit: parseInteger(req.query.limit, 50),
			offset: parseInteger(req.query.offset, 0),
		});

		res.status(200).json({ success: true, data: logs });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};

exports.getActivityLog = async (req, res) => {
	try {
		const { id } = req.params;

		const log = await activityLogService.getActivityLogById(id, {
			includeActor: parseBoolean(req.query.includeActor),
		});

		if (!log) {
			throw createError(404, 'Activity log not found');
		}

		res.status(200).json({ success: true, data: log });
	} catch (err) {
		const status = getStatusCode(err);
		res.status(status).json({ success: false, error: err.message || 'Terjadi kesalahan' });
	}
};
