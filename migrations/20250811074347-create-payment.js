'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable("payments", {
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
          payment_type: {
              type: Sequelize.ENUM('down_payment', 'full_payment'),
              allowNull: false,
          },
          payment_mehtod: {
              type: Sequelize.ENUM('cash', 'transfer'),
              allowNull: false,
          },
          amount: {
              type: Sequelize.DECIMAL(12, 2),
              allowNull: false,
          },
          date: {
              type: Sequelize.DATEONLY,
              allowNull: false,
          },
          notes: {
              type: Sequelize.TEXT,
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
              type: Sequelize.DATE,
              allowNull: true,
          },
      });
  },

  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable("payments");
  }
};
