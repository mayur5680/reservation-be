"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("GroupTable", "isPrivate");
    await queryInterface.removeColumn("GroupTable", "image");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("GroupTable", "isPrivate");
    await queryInterface.addColumn("GroupTable", "image");
  },
};
