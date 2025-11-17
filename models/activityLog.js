module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    'ActivityLog',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      actor_user_id: { type: DataTypes.BIGINT },
      entity_type: { type: DataTypes.STRING(50), allowNull: false },
      entity_id: { type: DataTypes.BIGINT },
      action: { type: DataTypes.STRING(50), allowNull: false },
      message: { type: DataTypes.TEXT },
      meta: { type: DataTypes.JSONB },
    },
    {
      tableName: 'activity_logs',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, { foreignKey: 'actor_user_id', as: 'actor' });
  };

  return ActivityLog;
};