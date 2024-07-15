"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Coupon", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      outletId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Outlet",
          key: "id",
        },
      },
      startDate: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      endDate: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      openingTime: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      closingTime: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      discountAmount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      noOfPerson: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      repeatOn: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tc: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isCampaignActive: {
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
    await queryInterface.dropTable("Coupon");
  },
};
