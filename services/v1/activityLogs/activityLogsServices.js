const { ActivityLog } = require('../../../models');

const createActivityLog = async ({
  actorUserId,
  entityType,
  entityId = null,
  action,
  message = null,
  meta = null,
  transaction,
}) => {
  return ActivityLog.create(
    {
      actor_user_id: actorUserId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      message,
      meta,
    },
    { transaction }
  );
};

const getActivityLogs = async ({
  filters = {},
  includeActor = false,
  limit = 50,
  offset = 0,
  order = [['created_at', 'DESC']],
} = {}) => {
  const query = {
    where: filters,
    limit,
    offset,
    order,
  };

  if (includeActor) {
    query.include = [{ association: 'actor', attributes: ['id', 'username', 'role'] }];
  }

  return ActivityLog.findAll(query);
};

const getActivityLogById = async (id, { includeActor = false } = {}) => {
  const query = {};

  if (includeActor) {
    query.include = [{ association: 'actor', attributes: ['id', 'username', 'role'] }];
  }

  return ActivityLog.findByPk(id, query);
};

module.exports = {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
};