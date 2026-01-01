module.exports = (sequelize, DataTypes) => {
  const MonthlyProfit = sequelize.define(
    "MonthlyProfit",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      month: {
        type: DataTypes.STRING(7),
        allowNull: false,
        unique: true,
      },
      total_profit: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      calculated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      note: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "monthly_profits",
      freezeTableName: true,
      timestamps: false,
    }
  );

  //   MonthlyProfit.associate = (models) => {
  //     MonthlyProfit.hasMany(models.MonthlyProfitShare, {
  //       foreignKey: "monthly_profit_id",
  //       as: "shares",
  //     });
  //   };

  return MonthlyProfit;
};
