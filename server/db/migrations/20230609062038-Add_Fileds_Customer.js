"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Customer", "eatPoints", {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn("Customer", "noOfRefferalSignUp", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn("Customer", "noOfRefferalPurchased", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Customer", "eatPoints");
    await queryInterface.removeColumn("Customer", "noOfRefferalSignUp");
    await queryInterface.removeColumn("Customer", "noOfRefferalPurchased");
  },
};
