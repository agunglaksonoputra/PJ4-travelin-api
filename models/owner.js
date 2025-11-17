module.exports = (sequelize, DataTypes) => {
  const Owner = sequelize.define(
    'Owner',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      phone: { type: DataTypes.STRING(30) },
      notes: { type: DataTypes.TEXT },
    },
    {
      tableName: 'owners',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Owner.associate = (models) => {
    Owner.hasMany(models.ProfitShare, { foreignKey: 'owner_id', as: 'profitShares' });
    Owner.hasMany(models.OwnerWithdrawal, { foreignKey: 'owner_id', as: 'withdrawals' });
  };

  return Owner;
};