module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    'Transaction',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      trip_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM({
          name: 'transaction_status',
          values: ['planning', 'payment', 'reporting', 'closed', 'canceled'],
        }),
        allowNull: false,
        defaultValue: 'planning',
      },
      customer_name: { type: DataTypes.STRING(150), allowNull: false },
      customer_phone: { type: DataTypes.STRING(30) },
      vehicle_id: { type: DataTypes.BIGINT, allowNull: false },
      tariff_id: { type: DataTypes.BIGINT },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: false },
      destination: { type: DataTypes.STRING(200) },
      notes: { type: DataTypes.TEXT },
      price_per_day: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      duration_days: { type: DataTypes.INTEGER },
      total_cost: { type: DataTypes.DECIMAL(14, 2) },
      created_by: { type: DataTypes.BIGINT },
    },
    {
      tableName: 'transactions',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
    Transaction.belongsTo(models.Tariff, { foreignKey: 'tariff_id', as: 'tariff' });
    Transaction.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    Transaction.hasMany(models.TransactionPayment, { foreignKey: 'transaction_id', as: 'payments' });
    Transaction.hasMany(models.TransactionRefund, { foreignKey: 'transaction_id', as: 'refunds' });
    Transaction.hasOne(models.TransactionReport, { foreignKey: 'transaction_id', as: 'report' });
    Transaction.hasOne(models.ProfitShare, { foreignKey: 'transaction_id', as: 'profitShare' });
    Transaction.hasMany(models.TransactionStatusLog, { foreignKey: 'transaction_id', as: 'statusLogs' });
  };

  return Transaction;
};