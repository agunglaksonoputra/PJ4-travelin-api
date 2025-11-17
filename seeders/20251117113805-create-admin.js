'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    await queryInterface.bulkInsert(
      'users',
      [
        {
          name: 'Super Admin',
          username: 'admin',
          password: passwordHash,
          role: 'admin',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  },
};