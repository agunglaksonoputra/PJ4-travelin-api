module.exports = (Sequelize, DataTypes) => {
    const UserToken = sequelize.define('UserToken', {
        token: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
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
        timestamps: true,
        id: false
    });

    return UserToken;
};