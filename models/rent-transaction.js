module.exports = (sequelize, DataTypes) => {
    const RentTransaction = sequelize.define(
        "RentTransaction",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            customer: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            vehicle_id:{
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "vehicles",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },
            start_date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            end_date: {
                type:DataTypes.DATEONLY,
            },
            class_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "tariff_classes",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },
            total_price: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
            },
            payment_status: {
                type: DataTypes.ENUM('pending', 'paid', 'failed'),
                allowNull: false,
            },
            transaction_status: {
                type: DataTypes.ENUM('planning', 'payment', 'report', 'closed'),
                allowNull: false,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            updatedBy: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },
        },
        {
            tableName: "rent_transactions",
            timestamps: true,
            paranoid: true,
        }
    );

    return RentTransaction;
};
