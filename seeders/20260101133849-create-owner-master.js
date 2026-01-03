"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert("owners", [
      {
        id: 1,
        name: "Joko",
        phone: null,
        shares_percentage: 25,
        notes: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: "Pak Zainal",
        phone: null,
        shares_percentage: 25,
        notes: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        name: "Bu Zainal",
        phone: null,
        shares_percentage: 25,
        notes: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        name: "Cadangan",
        phone: null,
        shares_percentage: 15,
        notes: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 5,
        name: "Zakat",
        phone: null,
        shares_percentage: 10,
        notes: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("owners", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
