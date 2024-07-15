"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.insert(null, "User", {
      userName: "11mscit074@gmail.com",
      email: "11mscit074@gmail.com",
      password:"admin@789",
      roleId:1,
      isPartially:true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.delete("User");
  },
};
