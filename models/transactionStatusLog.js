module.exports = (sequelize, DataTypes) => {
  const TransactionStatusLog = sequelize.define(
    'TransactionStatusLog',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      transaction_id: { type: DataTypes.BIGINT, allowNull: false },
      from_status: {
        type: DataTypes.ENUM({
          name: 'transaction_status',
          values: ['planning', 'payment', 'reporting', 'closed', 'canceled'],
        }),
      },
      to_status: {
        type: DataTypes.ENUM({
          name: 'transaction_status',
          values: ['planning', 'payment', 'reporting', 'closed', 'canceled'],
        }),
        allowNull: false,
      },
      changed_by: { type: DataTypes.BIGINT },
      changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      note: { type: DataTypes.TEXT },
    },
    {
      tableName: 'transaction_status_logs',
      freezeTableName: true,
      timestamps: false,
    }
  );

  TransactionStatusLog.associate = (models) => {
    TransactionStatusLog.belongsTo(models.Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
    TransactionStatusLog.belongsTo(models.User, { foreignKey: 'changed_by', as: 'changer' });
  };

  return TransactionStatusLog;
};