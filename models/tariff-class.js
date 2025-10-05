module.exports = (sequelize, DataTypes) => {
    const TariffClass = sequelize.define(
        "TariffClass",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(25),
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
            },
            price: {
                type: DataTypes.DECIMAL,
                allowNull: false,
            },
            active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: "tariff_classes",
            timestamps: true,
            paranoid: true,
        }
    );

    return TariffClass;
};
