"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Company", "twilioAccountSid", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Company", "twilioAuthToken", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Company", "twilioMessagingServiceSid", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Company", "chopeName");
    await queryInterface.removeColumn("Company", "chopeBookingId");
    await queryInterface.removeColumn("Company", "twilioMessagingServiceSid");
  },
};
