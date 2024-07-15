"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex("OutletTag", {
      unique: true,
      fields: ["tagId", "outletId"],
      name: "unique_outletId_tagId",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("OutletTag", "unique_outletId_tagId");
  },
};
