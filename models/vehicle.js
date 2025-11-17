module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    'Vehicle',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      plate_number: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      brand: { type: DataTypes.STRING(100) },
      model: { type: DataTypes.STRING(100) },
      manufacture_year: { type: DataTypes.SMALLINT },
      status: {
        type: DataTypes.ENUM({ name: 'vehicle_status', values: ['active', 'maintenance', 'retired'] }),
        allowNull: false,
        defaultValue: 'active',
      },
      notes: { type: DataTypes.TEXT },
    },
    {
      tableName: 'vehicles',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Vehicle.associate = (models) => {
    Vehicle.hasMany(models.Transaction, { foreignKey: 'vehicle_id', as: 'transactions' });
  };

  return Vehicle;
};