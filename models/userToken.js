module.exports = (sequelize, DataTypes) => {
    const UserToken = sequelize.define('UserToken', {
        token: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        type: {
            type: DataTypes.ENUM("signup", "reset_password"),
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        }
    }, {
        tableName: "user_tokens",
        timestamps: false,
        id: false
    });

    return UserToken;
};