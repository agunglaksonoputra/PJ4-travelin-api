'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('owner_withdrawals', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        owner_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'owners',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        withdrawn_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        amount: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
        },
        method: {
          type: 'payment_method',
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
      await queryInterface.dropTable('owner_withdrawals', { transaction: t });
    });
  }
};
