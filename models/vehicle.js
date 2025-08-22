module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define(
        "Vehicle",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            plate_number: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            capacity: {
              type: DataTypes.INTEGER,
              allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('available', 'rented', 'off'),
                defaultValue: 'available',
                allowNull: false,
            },
        },
        {
            tableName: "vehicles",
            timestamps: true,
            paranoid: true,
        }
    );

    return Vehicle;
};
