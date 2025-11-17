module.exports = (sequelize, DataTypes) => {
  const TransactionReport = sequelize.define(
    'TransactionReport',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      transaction_id: { type: DataTypes.BIGINT, allowNull: false },
      report_date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
      driver_name: { type: DataTypes.STRING(150) },
      km_start: { type: DataTypes.INTEGER },
      km_end: { type: DataTypes.INTEGER },
      driver_fee: { type: DataTypes.DECIMAL(12, 2) },
      gasoline_cost: { type: DataTypes.DECIMAL(12, 2) },
      toll_cost: { type: DataTypes.DECIMAL(12, 2) },
      parking_cost: { type: DataTypes.DECIMAL(12, 2) },
      misc_cost: { type: DataTypes.DECIMAL(12, 2) },
      notes: { type: DataTypes.TEXT },
      total_operational_cost: { type: DataTypes.DECIMAL(14, 2) },
    },
    {
      tableName: 'transaction_reports',
      freezeTableName: true,
      timestamps: false,
    }
  );

  TransactionReport.associate = (models) => {
    TransactionReport.belongsTo(models.Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
  };

  return TransactionReport;
};