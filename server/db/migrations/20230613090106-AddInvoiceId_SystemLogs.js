"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("SystemLog", "outletInvoiceId", {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: "OutletInvoice",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("SystemLog", "outletInvoiceId");
  },
};
