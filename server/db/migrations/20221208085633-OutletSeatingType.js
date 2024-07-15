"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "OutletSeatingType",
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
        seatingTypeId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "SeatingType",
            key: "id",
          },
        },
        image: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        height: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        width: {
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
          Items_unique: {
            unique: true,
            fields: ["seatingTypeId", "outletId"],
          },
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("SeatingType");
  },
};
