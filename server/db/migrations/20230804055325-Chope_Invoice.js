"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Outlet", "chopeName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("OutletInvoice", "chopeBookingId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Outlet", "chopeName");
    await queryInterface.removeColumn("OutletInvoice", "chopeBookingId");
  },
};
