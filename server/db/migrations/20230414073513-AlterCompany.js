"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Company", "mailChimpPublicKey", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Company", "mailChimpPrivateKey", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Company", "audianceList", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Company", "mailChimpStatus", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Company", "mailChimpPublicKey");
    await queryInterface.removeColumn("Company", "mailChimpPrivateKey");
    await queryInterface.removeColumn("Company", "audianceList");
    await queryInterface.removeColumn("Company", "mailChimpStatus");
  },
};
