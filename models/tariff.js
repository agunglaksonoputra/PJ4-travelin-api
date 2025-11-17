module.exports = (sequelize, DataTypes) => {
  const Tariff = sequelize.define(
    'Tariff',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      base_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      description: { type: DataTypes.TEXT },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'tariffs',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  Tariff.associate = (models) => {
    Tariff.hasMany(models.Transaction, { foreignKey: 'tariff_id', as: 'transactions' });
  };

  return Tariff;
};