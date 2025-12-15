'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      const exec = (sql) => queryInterface.sequelize.query(sql, { transaction: t });

      await exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_payment_plan_method') THEN
            CREATE TYPE "transaction_payment_plan_method" AS ENUM ('cash','credit');
          END IF;
        END$$;
      `);

      await queryInterface.addColumn(
        'transactions',
        'payment_plan_method',
        {
          type: 'transaction_payment_plan_method',
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'transactions',
        'paid_amount',
        {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
          defaultValue: 0,
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'transactions',
        'outstanding_amount',
        {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
          defaultValue: 0,
        },
        { transaction: t }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      const exec = (sql) => queryInterface.sequelize.query(sql, { transaction: t });

      await queryInterface.removeColumn('transactions', 'outstanding_amount', { transaction: t });
      await queryInterface.removeColumn('transactions', 'paid_amount', { transaction: t });
      await queryInterface.removeColumn('transactions', 'payment_plan_method', { transaction: t });

      await exec('DROP TYPE IF EXISTS "transaction_payment_plan_method"');
    });
  },
};
