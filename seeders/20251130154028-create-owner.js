'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Owner123!', 10);

    await queryInterface.bulkInsert(
      'users',
      [
        {
          name: 'Owner',
          username: 'owner',
          password: passwordHash,
          role: 'owner',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { username: 'owner' }, {});
  },
};