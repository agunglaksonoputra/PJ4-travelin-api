'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'transaction_payments',
        { transaction_id: [301, 302, 303, 3001, 3002, 3003] },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'transactions',
        { id: [301, 302, 303, 3001, 3002, 3003, 3004, 3005, 3006, 3007] },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'tariffs',
        { id: [201, 202, 2001, 2002] },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'vehicles',
        { id: [101, 102, 1001, 1002] },
        { transaction }
      );

      await queryInterface.bulkInsert(
        'vehicles',
        [
          {
            id: 1001,
            plate_number: 'B 1122 TLA',
            brand: 'Toyota',
            model: 'HiAce Premio',
            manufacture_year: 2023,
            status: 'active',
            notes: 'Dedicated for premium airport shuttle services.',
            created_at: now,
            updated_at: now,
          },
          {
            id: 1002,
            plate_number: 'B 3344 TLB',
            brand: 'Hyundai',
            model: 'County',
            manufacture_year: 2022,
            status: 'active',
            notes: 'Configured for corporate trips with 20 seats.',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'tariffs',
        [
          {
            id: 2001,
            code: 'TAR-BUS-INN',
            base_price: '1600000.00',
            description: 'Inner-city charter per day including driver and fuel.',
            is_active: true,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 2002,
            code: 'TAR-BUS-EXP',
            base_price: '2400000.00',
            description: 'Out-of-town charter package with accommodation.',
            is_active: true,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'transactions',
        [
          {
            id: 3001,
            trip_code: 'TRIP-20260105-01',
            status: 'planning',
            customer_name: 'PT Nusantara Wisata',
            customer_phone: '+6281234567890',
            vehicle_id: 1001,
            tariff_id: 2001,
            start_date: '2026-01-15',
            end_date: '2026-01-17',
            destination: 'Bandung',
            notes: 'Customer requested onboard Wi-Fi and refreshments.',
            price_per_day: '1600000.00',
            duration_days: 3,
            total_cost: '4800000.00',
            payment_plan_method: 'credit',
            paid_amount: '1500000.00',
            outstanding_amount: '3300000.00',
            created_by: 1,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 3002,
            trip_code: 'TRIP-20260120-01',
            status: 'planning',
            customer_name: 'CV Mitra Event',
            customer_phone: '+6289876543210',
            vehicle_id: 1002,
            tariff_id: 2002,
            start_date: '2026-02-02',
            end_date: '2026-02-05',
            destination: 'Semarang',
            notes: 'Corporate outing with bilingual guide.',
            price_per_day: '2400000.00',
            duration_days: 4,
            total_cost: '9600000.00',
            payment_plan_method: 'cash',
            paid_amount: '9600000.00',
            outstanding_amount: '0.00',
            created_by: 1,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 3003,
            trip_code: 'TRIP-20260210-01',
            status: 'planning',
            customer_name: 'SMAN 5 Jakarta',
            customer_phone: '+6281122334455',
            vehicle_id: 1001,
            tariff_id: 2001,
            start_date: '2026-03-01',
            end_date: '2026-03-03',
            destination: 'Bogor',
            notes: 'School excursion tentative schedule.',
            price_per_day: '1600000.00',
            duration_days: 3,
            total_cost: '4800000.00',
            payment_plan_method: 'credit',
            paid_amount: '0.00',
            outstanding_amount: '4800000.00',
            created_by: 1,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'transaction_payments',
        [
          {
            id: 4001,
            transaction_id: 3001,
            paid_at: now,
            method: 'transfer',
            amount: '1500000.00',
            note: 'Initial down payment for Bandung trip.',
          },
          {
            id: 4002,
            transaction_id: 3002,
            paid_at: now,
            method: 'cash',
            amount: '9600000.00',
            note: 'Full payment received on booking.',
          },
          {
            id: 4003,
            transaction_id: 3003,
            paid_at: now,
            method: 'cash',
            amount: '0.00',
            note: 'Awaiting initial payment.',
          },
        ],
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(
        'transaction_payments',
        { id: [4001, 4002, 4003] },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'transactions',
        { id: [3001, 3002, 3003] },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'tariffs',
        { id: [2001, 2002] },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'vehicles',
        { id: [1001, 1002] },
        { transaction }
      );
    });
  },
};
