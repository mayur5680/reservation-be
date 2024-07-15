"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Company", "paymentTC", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("Company", "noPaymentTC", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Company", "paymentTC");
    await queryInterface.removeColumn("Company", "noPaymentTC");
  },
};
