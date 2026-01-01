module.exports = (sequelize, DataTypes) => {
  const ProfitCache = sequelize.define(
    "ProfitCache",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      transaction_id: { type: DataTypes.BIGINT, allowNull: false },
      paid_amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      operational_cost: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      total: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    },
    {
      tableName: "profit_cache",
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  ProfitCache.associate = (models) => {
    ProfitCache.belongsTo(models.Transaction, { foreignKey: "transaction_id", as: "transaction" });
  };

  return ProfitCache;
};
