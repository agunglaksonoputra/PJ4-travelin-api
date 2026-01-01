module.exports = (sequelize, DataTypes) => {
  const ProfitShare = sequelize.define(
    "ProfitShare",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      monthly_profit_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      owner_id: { type: DataTypes.BIGINT, allowNull: false },
      share_amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      calculated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      note: { type: DataTypes.TEXT },
    },
    {
      tableName: "profit_shares",
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  ProfitShare.associate = (models) => {
    ProfitShare.belongsTo(models.MonthlyProfit, { foreignKey: "monthly_profit_id", as: "monthlyProfit" });
    ProfitShare.belongsTo(models.Owner, { foreignKey: "owner_id", as: "owner" });
  };

  return ProfitShare;
};
