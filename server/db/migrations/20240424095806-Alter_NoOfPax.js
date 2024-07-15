"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("OutletInvoice", "noOfAdult", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: true,
    });
    await queryInterface.addColumn("OutletInvoice", "noOfChild", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("OutletInvoice", "noOfAdult");
    await queryInterface.removeColumn("OutletInvoice", "noOfChild");
  },
};
