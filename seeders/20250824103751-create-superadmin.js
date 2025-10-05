'use strict';

const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      const hashedPassword = await bcrypt.hash("superadmin123", 10);

      await queryInterface.bulkInsert("users", [
          {
              username: "agunglp",
              password: hashedPassword,
              role_id: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
          }
      ], {});
  },

  async down (queryInterface, Sequelize) {
      await queryInterface.bulkDelete("users", { username: "superadmin" }, {});
  }
};
