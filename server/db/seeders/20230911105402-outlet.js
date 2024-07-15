"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.insert(null, "Outlet", {
      name: "test",
      createdBy: 1,
      updatedBy: 1,
      companyId: 1,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.delete("Outlet");
  },
};
