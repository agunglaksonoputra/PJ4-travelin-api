'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      const exec = (sql) => queryInterface.sequelize.query(sql, { transaction: t });

      await exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE "user_role" AS ENUM ('admin','staff','owner');
          END IF;
        END$$;
      `);

      await exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
            CREATE TYPE "vehicle_status" AS ENUM ('active','maintenance','retired');
          END IF;
        END$$;
      `);

      await exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
            CREATE TYPE "transaction_status" AS ENUM ('planning','payment','reporting','closed','canceled');
          END IF;
        END$$;
      `);

      await exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
            CREATE TYPE "payment_method" AS ENUM ('cash','transfer');
          END IF;
        END$$;
      `);

      await exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
            CREATE TYPE "refund_status" AS ENUM ('pending','approved','rejected');
          END IF;
        END$$;
      `);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      const exec = (sql) => queryInterface.sequelize.query(sql, { transaction: t });

      await exec('DROP TYPE IF EXISTS "refund_status"');
      await exec('DROP TYPE IF EXISTS "payment_method"');
      await exec('DROP TYPE IF EXISTS "transaction_status"');
      await exec('DROP TYPE IF EXISTS "vehicle_status"');
      await exec('DROP TYPE IF EXISTS "user_role"');
    });
  },
};