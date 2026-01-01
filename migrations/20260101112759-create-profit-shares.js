"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        "profit_shares",
        {
          id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          monthly_profit_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
            references: {
              model: "monthly_profits",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          owner_id: {
            type: Sequelize.BIGINT,
            allowNull: false,
            references: {
              model: "owners",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },
          share_amount: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
          },
          calculated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("NOW"),
          },
          note: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("NOW"),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("NOW"),
          },
        },
        { transaction: t }
      );
    });

    await queryInterface.addConstraint("profit_shares", {
      fields: ["monthly_profit_id", "owner_id"],
      type: "unique",
      name: "uniq_profit_share_month_owner",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable("profit_shares", { transaction: t });
    });
  },
};
