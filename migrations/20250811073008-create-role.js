'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable("roles", {
          id: {
              allowNull: false,
              autoIncrement: true,
              primaryKey: true,
              type: Sequelize.INTEGER,
          },
          name: {
              type: Sequelize.STRING(30),
              unique: true,
              allowNull: false,
          },
          description: {
              type: Sequelize.STRING,
              allowNull: true,
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
              allowNull: true,
              type: Sequelize.DATE,
          },
      });

      await queryInterface.bulkInsert("roles", [
          { name: "superadmin" },
          { name: "owner" },
          { name: "operator" },
          { name: "viewer" },
      ]);
  },

  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable("roles");
  }
};
