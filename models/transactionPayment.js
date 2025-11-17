module.exports = (sequelize, DataTypes) => {
  const TransactionPayment = sequelize.define(
    'TransactionPayment',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      transaction_id: { type: DataTypes.BIGINT, allowNull: false },
      paid_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      method: {
        type: DataTypes.ENUM({ name: 'payment_method', values: ['cash', 'transfer'] }),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      note: { type: DataTypes.TEXT },
    },
    {
      tableName: 'transaction_payments',
      freezeTableName: true,
      timestamps: false,
    }
  );

  TransactionPayment.associate = (models) => {
    TransactionPayment.belongsTo(models.Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
  };

  return TransactionPayment;
};