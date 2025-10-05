'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('user_tokens', {
          token: {
              type: Sequelize.STRING,
              allowNull: false,
              unique: true,
          },
          type: {
              type: Sequelize.ENUM("signup", "reset_password"),
              allowNull: false,
          },
          expiresAt: {
              type: Sequelize.DATE,
              allowNull: false,
          }
      });
  },

  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable('user_tokens');
  }
};
