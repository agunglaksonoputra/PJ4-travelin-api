"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkInsert(
        "profit_cache",
        [
          {
            id: 1,
            transaction_id: 3004,
            paid_amount: "7200000.00",
            operational_cost: "2100000.00",
            total: "5100000.00",
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "monthly_profits",
        [
          {
            id: 1,
            month: "2026-01",
            total_profit: "5100000.00",
            calculated_at: now,
            note: null,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "profit_shares",
        [
          {
            id: 1,
            monthly_profit_id: 1,
            owner_id: 1,
            share_amount: "1275000.00",
            calculated_at: now,
            note: "Profit share Januari 2026 - Joko",
            created_at: now,
            updated_at: now,
          },
          {
            id: 2,
            monthly_profit_id: 1,
            owner_id: 2,
            share_amount: "1275000.00",
            calculated_at: now,
            note: "Profit share Januari 2026 - Pak Zainal",
            created_at: now,
            updated_at: now,
          },
          {
            id: 3,
            monthly_profit_id: 1,
            owner_id: 3,
            share_amount: "1275000.00",
            calculated_at: now,
            note: "Profit share Januari 2026 - Bu Zainal",
            created_at: now,
            updated_at: now,
          },
          {
            id: 4,
            monthly_profit_id: 1,
            owner_id: 4,
            share_amount: "765000.00",
            calculated_at: now,
            note: "Cadangan operasional Januari 2026",
            created_at: now,
            updated_at: now,
          },
          {
            id: 5,
            monthly_profit_id: 1,
            owner_id: 5,
            share_amount: "510000.00",
            calculated_at: now,
            note: "Dana zakat Januari 2026",
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("profit_cache", { id: [1] }, { transaction });
    await queryInterface.bulkDelete("monthly_profits", { id: [1] }, { transaction });
    await queryInterface.bulkDelete("profit_shares", { id: [1, 2, 3, 4, 5] }, { transaction });
  },
};
