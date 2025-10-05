'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable("vehicles", {
          id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
          },
          plate_number: {
              type: Sequelize.STRING(20),
              allowNull: false,
          },
          type: {
              type: Sequelize.STRING(50),
              allowNull: false,
          },
          capacity: {
              type: Sequelize.INTEGER,
              allowNull: false,
          },
          status: {
              type: Sequelize.ENUM('available', 'rented', 'off'),
              defaultValue: 'available',
              allowNull: false,
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
      await queryInterface.dropTable("vehicles");
  }
};
