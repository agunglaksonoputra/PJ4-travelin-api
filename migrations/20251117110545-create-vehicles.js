'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('vehicles', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        plate_number: {
          type: Sequelize.STRING(32),
          allowNull: false,
          unique: true,
        },
        brand: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        model: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        manufacture_year: {
          type: Sequelize.SMALLINT,
          allowNull: true,
        },
        status: {
          type: 'vehicle_status', // Use the enum type created previously
          allowNull: false,
          defaultValue: 'active',
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      }, { transaction: t });
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('vehicles', { transaction: t });
    });
  }
};
