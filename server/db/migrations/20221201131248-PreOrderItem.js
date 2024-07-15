"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PreOrderItem", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sectionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Section",
          key: "id",
        },
      },
      outletId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Outlet",
          key: "id",
        },
      },
      unitPrice: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dailyMaxQty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      bookingMaxQty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      maximumSpend: {
        type: Sequelize.INTEGER,
      },
      creditCardHoldAmount: {
        type: Sequelize.INTEGER,
      },
      image: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("PreOrderItem");
  },
};
