"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "OutletSeatType",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        outletId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Outlet",
            key: "id",
          },
        },
        seatTypeId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "SeatType",
            key: "id",
          },
        },
        description: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        createdAt: {
          allowNull: false,
          defaultValue: Sequelize.fn("now"),
          type: Sequelize.DATE,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "User",
            key: "id",
          },
        },
        updatedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "User",
            key: "id",
          },
        },
      },
      {
        uniqueKeys: {
          Outlet_Seat_Unique: {
            unique: true,
            fields: ["seatTypeId", "outletId"],
          },
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("SeatingType");
  },
};
