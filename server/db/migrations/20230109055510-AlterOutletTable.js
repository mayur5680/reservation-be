"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("OutletTable", "minimumSpendAmount", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("OutletTable", "perPaxUnitDeposit", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("OutletTable", "image", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("OutletTable", "isPrivate", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.changeColumn("OutletTable", "outletSeatTypeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("OutletTable", "minimumSpendAmount");
    await queryInterface.removeColumn("OutletTable", "perPaxUnitDeposit");
    await queryInterface.removeColumn("OutletTable", "image");
    await queryInterface.removeColumn("OutletTable", "isPrivate");
    await queryInterface.removeColumn("OutletTable", "outletSeatTypeId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "OutletSeatType",
        key: "id",
      },
    });
  },
};
