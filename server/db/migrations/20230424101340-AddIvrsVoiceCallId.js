"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("IvrsDetails", "ivrsVoiceCallId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "IvrsVoiceCall",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("IvrsDetails", "ivrsVoiceCallId");
  },
};
