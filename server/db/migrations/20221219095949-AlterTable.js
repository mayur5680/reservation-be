"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Table", "image", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn("Table", "height", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn("Table", "width", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Table", "shape", {
      type: Sequelize.STRING,
      allowNull: false,
      after: "image",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Table", "image", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn("Table", "height", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn("Table", "width", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.removeColumn("Table", "shape");
  },
};
