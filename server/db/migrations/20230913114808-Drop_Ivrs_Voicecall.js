"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("IvrsDetails", "ivrsVoiceCallId");
    await queryInterface.dropTable("IvrsVoiceCall");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("IvrsDetails", "ivrsVoiceCallId");
    await queryInterface.createTable("IvrsVoiceCall");
  },
};
