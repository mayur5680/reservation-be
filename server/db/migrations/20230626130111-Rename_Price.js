"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn("PreOrderItem", "unitPrice", "price");
    await queryInterface.renameColumn("TableSection", "depositPrice", "price");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("PreOrderItem", "price");
    await queryInterface.removeConstraint("TableSection", "price");
  },
};
