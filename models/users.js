module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        "User",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            username: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            password: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            role_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 3,
                references: {
                    model: "roles",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },
        },
        {
            tableName: "users",
            timestamps: true,
            paranoid: true,
        }
    );

    User.associate = (models) => {
        User.belongsTo(models.Role, {
            foreignKey: "role_id",
            as: "role",
        });
    };

    return User;
};
