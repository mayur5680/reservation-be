"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint("OutletInvoice", {
      type:'unique',
      fields: ["chopeBookingId"],
      name: "unique_bookingId",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("OutletInvoice", "unique_bookingId");
  },
};
