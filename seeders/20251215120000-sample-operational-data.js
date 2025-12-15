'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkInsert(
        'vehicles',
        [
          {
            id: 101,
            plate_number: 'B 1234 TRT',
            brand: 'Toyota',
            model: 'HiAce',
            manufacture_year: 2022,
            status: 'active',
            notes: 'Units dedicated for airport shuttle.',
            created_at: now,
            updated_at: now,
          },
          {
            id: 102,
            plate_number: 'B 5678 TRV',
            brand: 'Mercedes-Benz',
            model: 'Sprinter',
            manufacture_year: 2021,
            status: 'active',
            notes: 'VIP configuration with reclining seats.',
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
            id: 201,
            code: 'TAR-BUS-DAILY',
            base_price: '1500000.00',
            description: 'Standard daily charter for 12-hour operation.',
            is_active: true,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 202,
            code: 'TAR-BUS-OUT',
            base_price: '2200000.00',
            description: 'Out-of-town charter package including driver allowance.',
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
            id: 301,
            trip_code: 'TRIP-20251215-01',
            status: 'payment',
            customer_name: 'PT Nusantara Wisata',
            customer_phone: '+6281234567890',
            vehicle_id: 101,
            tariff_id: 201,
            start_date: '2025-12-20',
            end_date: '2025-12-22',
            destination: 'Bandung',
            notes: 'Customer requested onboard Wi-Fi.',
            price_per_day: '1500000.00',
            duration_days: 3,
            total_cost: '4500000.00',
            created_by: 1,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 302,
            trip_code: 'TRIP-20251215-02',
            status: 'payment',
            customer_name: 'CV Mitra Event',
            customer_phone: '+6289876543210',
            vehicle_id: 102,
            tariff_id: 202,
            start_date: '2025-12-28',
            end_date: '2025-12-30',
            destination: 'Yogyakarta',
            notes: 'Include bilingual tour guide.',
            price_per_day: '2200000.00',
            duration_days: 3,
            total_cost: '6600000.00',
            created_by: 1,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 303,
            trip_code: 'TRIP-20251215-03',
            status: 'planning',
            customer_name: 'SMAN 5 Jakarta',
            customer_phone: '+6281122334455',
            vehicle_id: 101,
            tariff_id: 201,
            start_date: '2026-01-10',
            end_date: '2026-01-12',
            destination: 'Bogor',
            notes: 'School excursion tentative schedule.',
            price_per_day: '1500000.00',
            duration_days: 3,
            total_cost: '4500000.00',
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
            id: 401,
            transaction_id: 301,
            paid_at: now,
            method: 'transfer',
            amount: '3000000.00',
            note: 'Down payment 66%.',
          },
          {
            id: 402,
            transaction_id: 302,
            paid_at: now,
            method: 'cash',
            amount: '2200000.00',
            note: 'First installment on contract signing.',
          },
          {
            id: 403,
            transaction_id: 302,
            paid_at: now,
            method: 'transfer',
            amount: '2200000.00',
            note: 'Second installment.',
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
        { id: [401, 402, 403] },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'transactions',
        { id: [301, 302, 303] },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'tariffs',
        { id: [201, 202] },
        { transaction }
      );

      await queryInterface.bulkDelete(
        'vehicles',
        { id: [101, 102] },
        { transaction }
      );
    });
  },
};
