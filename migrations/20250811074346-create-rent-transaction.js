'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable("rent_transactions", {
          id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
          },
          customer: {
              type: Sequelize.STRING(50),
              allowNull: false,
          },
          vehicle_id:{
              type: Sequelize.INTEGER,
              allowNull: false,
              references: {
                  model: "vehicles",
                  key: "id",
              },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
          },
          start_date: {
              type: Sequelize.DATEONLY,
              allowNull: false,
          },
          end_date: {
              type:Sequelize.DATEONLY,
          },
          class_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: {
                  model: "tariff_classes",
                  key: "id",
              },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
          },
          total_price: {
              type: Sequelize.DECIMAL(12, 2),
              allowNull: false,
          },
          payment_status: {
              type: Sequelize.ENUM('pending', 'paid', 'failed'),
              allowNull: false,
          },
          transaction_status: {
              type: Sequelize.ENUM('planning', 'payment', 'report', 'closed'),
              allowNull: false,
          },
          notes: {
              type: Sequelize.TEXT,
              allowNull: true,
          },
          updatedBy: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: {
                  model: "users",
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
      await queryInterface.dropTable("rent_transactions");
  }
};
