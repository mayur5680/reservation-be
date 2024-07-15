"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("OutletInvoice", "stripeSetupIntentId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("OutletInvoice", "stripePaymentMethodId", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("OutletInvoice", "isValidSetupIntent", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("OutletInvoice", "stripeSetupIntentId");
    await queryInterface.removeColumn("OutletInvoice", "stripePaymentMethodId");
    await queryInterface.removeColumn("OutletInvoice", "isValidSetupIntent");
  },
};
