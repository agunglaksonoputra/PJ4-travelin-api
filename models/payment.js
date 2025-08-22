module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define(
        "Payment",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            transaction_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "rent_transactions",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },
            payment_type: {
                type: DataTypes.ENUM('down_payment', 'full_payment'),
                allowNull: false,
            },
            payment_mehtod: {
                type: DataTypes.ENUM('cash', 'transfer'),
                allowNull: false,
            },
            amount: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false,
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: "payments",
            timestamps: true,
            paranoid: true,
        }
    );

    return Payment;
};
