"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Outlet", "SipCode", {
      type: Sequelize.STRING,
      defaultValue: "104",
    });
    await queryInterface.addColumn("IvrsDetails", "isEmailSend", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Outlet", "SipCode");
    await queryInterface.removeColumn("IvrsDetails", "isEmailSend");
  },
};
