module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define(
        "Role",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            description: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: "roles",
            timestamps: true,
            paranoid: true,
        }
    );

    Role.associate = (models) => {
        Role.hasMany(models.User, {
            foreignKey: "role_id",
            as: "user",
        });
    };

    return Role;
};
