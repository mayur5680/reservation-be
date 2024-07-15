"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Company", "ivrsUserKey", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Company", "ivrsSecretKey", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Company", "ivrsUserKey");
    await queryInterface.removeColumn("Company", "ivrsSecretKey");
  },
};
