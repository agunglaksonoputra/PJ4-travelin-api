'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('transaction_payments', {
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
        paid_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        method: {
          type: 'payment_method',
          allowNull: false,
        },
        amount: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
        },
        note: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
      }, { transaction: t });
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('transaction_payments', { transaction: t });
    });
  }
};
