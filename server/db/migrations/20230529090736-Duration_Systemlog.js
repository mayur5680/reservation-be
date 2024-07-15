"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("SystemLog", "duration", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn(
      "SystemLog",
      "callerId",
      {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      {
        uniqueKeys: {
          Items_unique: {
            unique: true,
            fields: ["callerId"],
          },
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("SystemLog", "duration");
    await queryInterface.removeColumn("SystemLog", "callerId");
  },
};
