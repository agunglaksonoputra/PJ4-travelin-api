'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('transactions', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        trip_code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        status: {
          type: 'transaction_status',
          allowNull: false,
          defaultValue: 'planning',
        },
        customer_name: {
          type: Sequelize.STRING(150),
          allowNull: false,
        },
        customer_phone: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
        vehicle_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'vehicles',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        tariff_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'tariffs',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        start_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        end_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        destination: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        price_per_day: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
        },
        duration_days: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        total_cost: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: true,
        },
        created_by: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
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
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      }, { transaction: t });
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('transactions', { transaction: t });
    });
  }
};
