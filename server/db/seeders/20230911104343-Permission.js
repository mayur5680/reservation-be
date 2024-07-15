"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.insert(null, "UserPermission", {
      roleId: 1,
      permission: `[{"moduleName":"OutletManagement","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"MealType","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"MealTiming","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"Closure","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"TimingPromo","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"PreOrder","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"EmailTemplate","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"DinningOption","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"SmsTemplate","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"SeatPlans","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"Spaces","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"SeatType","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"TableManagement","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"TagCategory","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"Tags","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"AutoTagging","isCreate":true,"isRead":true,"isUpdate":null,"isDelete":true},{"moduleName":"ReservedKeywords","isCreate":null,"isRead":true,"isUpdate":null,"isDelete":null},{"moduleName":"ReservationManagement","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":null},{"moduleName":"CallManagement","isCreate":null,"isRead":true,"isUpdate":true,"isDelete":null},{"moduleName":"Ticketing","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"CustomerManagement","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"Materials","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"MaterialCategory","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"MaterialSubCategory","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"UserGroup","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"UserList","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"UserGroupAccess","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"CompanyManagement","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true},{"moduleName":"SuperUser","isCreate":true,"isRead":true,"isUpdate":true,"isDelete":true}]`,
      createdBy: 1,
      updatedBy: 1,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.delete("UserPermission");
  },
};
