"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("TagCategory", [
      {
        id: 24,
        name: "Dietary Restrictions",
        description: "Diets, Allergies",
        createdBy: 1,
        updatedBy: 1,
      },
      {
        id: 26,
        name: "Occasion",
        description: "Special Event",
        createdBy: 1,
        updatedBy: 1,
      },
      {
        id: 27,
        name: "Seating Preference",
        description: "Diets, Allergies",
        createdBy: 1,
        updatedBy: 1,
      },
      {
        id: 32,
        name: "Customer Tags",
        description: "Customer Tags",
        createdBy: 1,
        updatedBy: 1,
      },

      {
        id: 33,
        name: "Mailchimp Audience List",
        description: "Mailchimp",
        createdBy: 1,
        updatedBy: 1,
      },
      {
        id: 34,
        name: "Call Tags",
        description: "Call Tags",
        createdBy: 1,
        updatedBy: 1,
      },
      {
        id: 37,
        name: "Material Tags",
        description: "Material Tags",
        createdBy: 1,
        updatedBy: 1,
      },
      {
        id: 42,
        name: "Marketing Tags",
        description: "Marketing Tags",
        createdBy: 1,
        updatedBy: 1,
      },
      {
        id: 51,
        name: "Meal Session",
        description: "Meal Session",
        createdBy: 1,
        updatedBy: 1,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("TagCategory", null, {});
  },
};
