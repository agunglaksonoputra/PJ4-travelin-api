'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable("users", {
          id: {
              allowNull: false,
              autoIncrement: true,
              primaryKey: true,
              type: Sequelize.INTEGER,
          },
          username: {
              type: Sequelize.STRING(50),
              allowNull: false,
          },
          password: {
              type: Sequelize.STRING,
              allowNull: false,
          },
          role_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 3,
              references: {
                  model: "roles",
                  key: "id",
              },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
          },
          createdAt: {
              allowNull: false,
              type: Sequelize.DATE,
              defaultValue: Sequelize.fn("NOW"),
          },
          updatedAt: {
              allowNull: false,
              type: Sequelize.DATE,
              defaultValue: Sequelize.fn("NOW"),
          },
          deletedAt: {
              type: Sequelize.DATE,
              allowNull: true,
          },
      });
  },

  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable("users");
  }
};
