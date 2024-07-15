"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("OutletInvoice", "customerCompanyName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("OutletInvoice", "privateRoom", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("OutletInvoice", "customerCompanyName");
    await queryInterface.removeColumn("OutletInvoice", "privateRoom");
  },
};
