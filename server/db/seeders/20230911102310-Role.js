"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.insert(null, "Role", {
      name: "SuperAdmin",
      description: "SuperAdmin",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.delete("Role");
  },
};
