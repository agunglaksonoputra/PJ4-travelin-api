module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      username: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      password: { type: DataTypes.TEXT, allowNull: false },
      role: {
        type: DataTypes.ENUM({ name: 'user_role', values: ['admin', 'staff', 'owner'] }),
        allowNull: false,
      },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'users',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Transaction, { foreignKey: 'created_by', as: 'transactions' });
    User.hasMany(models.TransactionStatusLog, { foreignKey: 'changed_by', as: 'statusChanges' });
    User.hasMany(models.ActivityLog, { foreignKey: 'actor_user_id', as: 'activities' });
  };

  return User;
};