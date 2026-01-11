"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete("transaction_payments", { transaction_id: [301, 302, 303, 3001, 3002, 3003, 3004] }, { transaction });

      await queryInterface.bulkDelete("transactions", { id: [301, 302, 303, 3001, 3002, 3003, 3004, 3005, 3006, 3007] }, { transaction });

      await queryInterface.bulkDelete("tariffs", { id: [201, 202, 2001, 2002] }, { transaction });

      await queryInterface.bulkDelete("vehicles", { id: [101, 102, 1001, 1002] }, { transaction });

      await queryInterface.bulkInsert(
        "vehicles",
        [
          {
            id: 1001,
            plate_number: "B 1122 TLA",
            brand: "Toyota",
            model: "HiAce Premio",
            manufacture_year: 2023,
            status: "active",
            notes: "Dedicated for premium airport shuttle services.",
            created_at: now,
            updated_at: now,
          },
          {
            id: 1002,
            plate_number: "B 3344 TLB",
            brand: "Hyundai",
            model: "County",
            manufacture_year: 2022,
            status: "active",
            notes: "Configured for corporate trips with 20 seats.",
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "tariffs",
        [
          {
            id: 2001,
            code: "TAR-BUS-INN",
            base_price: "1600000.00",
            description: "Inner-city charter per day including driver and fuel.",
            is_active: true,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 2002,
            code: "TAR-BUS-EXP",
            base_price: "2400000.00",
            description: "Out-of-town charter package with accommodation.",
            is_active: true,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "transactions",
        [
          {
            id: 3001,
            trip_code: "TRIP-20260105-01",
            status: "payment",
            customer_name: "PT Nusantara Wisata",
            customer_phone: "+6281234567890",
            vehicle_id: 1001,
            tariff_id: 2001,
            start_date: "2026-01-15",
            end_date: "2026-01-17",
            destination: "Bandung",
            notes: "Customer requested onboard Wi-Fi and refreshments.",
            price_per_day: "1600000.00",
            duration_days: 3,
            total_cost: "4800000.00",
            payment_plan_method: "credit",
            paid_amount: "1500000.00",
            outstanding_amount: "3300000.00",
            created_by: 1,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 3002,
            trip_code: "TRIP-20260120-01",
            status: "reporting",
            customer_name: "CV Mitra Event",
            customer_phone: "+6289876543210",
            vehicle_id: 1002,
            tariff_id: 2002,
            start_date: "2026-02-02",
            end_date: "2026-02-05",
            destination: "Semarang",
            notes: "Corporate outing with bilingual guide.",
            price_per_day: "2400000.00",
            duration_days: 4,
            total_cost: "9600000.00",
            payment_plan_method: "cash",
            paid_amount: "9600000.00",
            outstanding_amount: "0.00",
            created_by: 1,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 3003,
            trip_code: "TRIP-20260210-01",
            status: "planning",
            customer_name: "SMAN 5 Jakarta",
            customer_phone: "+6281122334455",
            vehicle_id: 1001,
            tariff_id: 2001,
            start_date: "2026-03-01",
            end_date: "2026-03-03",
            destination: "Bogor",
            notes: "School excursion tentative schedule.",
            price_per_day: "1600000.00",
            duration_days: 3,
            total_cost: "4800000.00",
            payment_plan_method: "credit",
            paid_amount: "0.00",
            outstanding_amount: "4800000.00",
            created_by: 1,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
          {
            id: 3004,
            trip_code: "TRIP-20260101-CL",
            status: "closed",
            customer_name: "PT Sukses Makmur",
            customer_phone: "+628777888999",
            vehicle_id: 1002,
            tariff_id: 2002,
            start_date: "2026-01-01",
            end_date: "2026-01-03",
            destination: "Yogyakarta",
            notes: "Trip completed successfully without issues.",
            price_per_day: "2400000.00",
            duration_days: 3,
            total_cost: "7200000.00",
            payment_plan_method: "cash",
            paid_amount: "7200000.00",
            outstanding_amount: "0.00",
            created_by: 1,
            created_at: now,
            updated_at: now,
            deleted_at: null,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "transaction_payments",
        [
          {
            id: 4001,
            transaction_id: 3001,
            paid_at: today,
            method: "transfer",
            amount: "1500000.00",
            note: "Initial down payment for Bandung trip.",
            created_at: now,
            updated_at: now,
          },
          {
            id: 4002,
            transaction_id: 3002,
            paid_at: today,
            method: "cash",
            amount: "9600000.00",
            note: "Full payment received on booking.",
            created_at: now,
            updated_at: now,
          },
          {
            id: 4003,
            transaction_id: 3004,
            paid_at: today,
            method: "transfer",
            amount: "7200000.00",
            note: "Full payment for completed Yogyakarta trip.",
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        "transaction_reports",
        [
          {
            id: 1,
            transaction_id: 3004,
            report_date: "2026-01-03",
            driver_name: "Budi Santoso",
            km_start: 12000,
            km_end: 12850,
            driver_fee: "900000.00",
            gasoline_cost: "650000.00",
            toll_cost: "300000.00",
            parking_cost: "150000.00",
            misc_cost: "100000.00",
            notes: "No incident during trip.",
            total_operational_cost: "2100000.00",
          },
        ],
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete("transaction_payments", { id: [4001, 4002, 4003, 4004] }, { transaction });

      await queryInterface.bulkDelete("transactions", { id: [3001, 3002, 3003, 3004] }, { transaction });

      await queryInterface.bulkDelete("tariffs", { id: [2001, 2002] }, { transaction });

      await queryInterface.bulkDelete("vehicles", { id: [1001, 1002] }, { transaction });
    });
  },
};
