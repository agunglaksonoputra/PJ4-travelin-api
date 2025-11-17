'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('transaction_refunds', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        transaction_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'transactions',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        requested_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        processed_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        status: {
          type: 'refund_status',
          allowNull: false,
          defaultValue: 'pending',
        },
        amount: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      }, { transaction: t });
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('transaction_refunds', { transaction: t });
    });
  }
};
