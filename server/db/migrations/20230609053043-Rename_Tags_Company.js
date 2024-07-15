"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.renameColumn("Company", "audianceList", "tags");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("Company", "tags");
  },
};
