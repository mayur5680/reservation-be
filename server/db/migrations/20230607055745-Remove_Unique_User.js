"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("User", "User_userName_key", {
      logging: console.log,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("User", "User_userName_key");
  },
};
