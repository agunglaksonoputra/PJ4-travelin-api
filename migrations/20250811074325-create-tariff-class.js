'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable("tariff_classes", {
          id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
          },
          name: {
              type: Sequelize.STRING(25),
              allowNull: false,
          },
          description: {
              type: Sequelize.TEXT,
          },
          price: {
              type: Sequelize.DECIMAL,
              allowNull: false,
          },
          active: {
              type: Sequelize.BOOLEAN,
              defaultValue: true,
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

      await queryInterface.bulkInsert("tariff_classes", [
          { name: "A", price: 800000 },
          { name: "B", price: 825000 },
          { name: "C", price: 850000 },
          { name: "D", price: 900000 },
          { name: "E", price: 950000 },
          { name: "F", price: 1000000 },
      ]);
  },

  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable("tariff_classes");
  }
};
