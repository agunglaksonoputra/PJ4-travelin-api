module.exports = (sequelize, DataTypes) => {
    const TransactionLog = sequelize.define(
        "TransactionLog",
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
            action: {
                type: DataTypes.ENUM('create', 'update', 'delete'),
            },
        },
        {
            tableName: "transaction_logs",
            timestamps: true,
            paranoid: true,
        }
    );

    return TransactionLog;
};
