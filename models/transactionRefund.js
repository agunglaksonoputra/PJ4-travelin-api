module.exports = (sequelize, DataTypes) => {
  const TransactionRefund = sequelize.define(
    'TransactionRefund',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      transaction_id: { type: DataTypes.BIGINT, allowNull: false },
      requested_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      processed_at: { type: DataTypes.DATE },
      status: {
        type: DataTypes.ENUM({ name: 'refund_status', values: ['pending', 'approved', 'rejected'] }),
        allowNull: false,
        defaultValue: 'pending',
      },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      reason: { type: DataTypes.TEXT },
    },
    {
      tableName: 'transaction_refunds',
      freezeTableName: true,
      timestamps: false,
    }
  );

  TransactionRefund.associate = (models) => {
    TransactionRefund.belongsTo(models.Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
  };

  return TransactionRefund;
};