"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.insert(null, "Company", {
      key: "qwerty9876",
      name: "test",
      createdBy: 1,
      updatedBy: 1,
      contentLanguage: "ENGLISH",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.delete("Company");
  },
};
