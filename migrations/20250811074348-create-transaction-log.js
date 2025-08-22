'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable("transaction_logs", {
          id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
          },
          transaction_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: {
                  model: "rent_transactions",
                  key: "id",
              },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
          },
          action: {
              type: Sequelize.ENUM('create', 'update', 'delete'),
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
      await queryInterface.dropTable("transaction_logs");
  }
};
