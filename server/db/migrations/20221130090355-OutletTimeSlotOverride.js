"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("OutletTimeSlotOverride", {
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
      sectionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Section",
          key: "id",
        },
      },
      dayofweek: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      effectiveFrom: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      effectiveTo: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      openingTime: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      closingTime: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      reason: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      outletStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("OutletTimeSlotOverride");
  },
};
