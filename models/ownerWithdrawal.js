module.exports = (sequelize, DataTypes) => {
  const OwnerWithdrawal = sequelize.define(
    'OwnerWithdrawal',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      owner_id: { type: DataTypes.BIGINT, allowNull: false },
      withdrawn_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      method: {
        type: DataTypes.ENUM({ name: 'payment_method', values: ['cash', 'transfer'] }),
        allowNull: false,
      },
      note: { type: DataTypes.TEXT },
    },
    {
      tableName: 'owner_withdrawals',
      freezeTableName: true,
      timestamps: false,
    }
  );

  OwnerWithdrawal.associate = (models) => {
    OwnerWithdrawal.belongsTo(models.Owner, { foreignKey: 'owner_id', as: 'owner' });
  };

  return OwnerWithdrawal;
};