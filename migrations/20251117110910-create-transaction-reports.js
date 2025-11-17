'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('transaction_reports', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        transaction_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          unique: true,
          references: {
            model: 'transactions',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        report_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_DATE'),
        },
        driver_name: {
          type: Sequelize.STRING(150),
          allowNull: true,
        },
        km_start: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        km_end: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        driver_fee: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        gasoline_cost: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        toll_cost: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        parking_cost: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        misc_cost: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        total_operational_cost: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: true,
        },
      }, { transaction: t });
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('transaction_reports', { transaction: t });
    });
  }
};
