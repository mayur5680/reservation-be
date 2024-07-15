import { Sequelize } from "sequelize";
import { Role, SeatType, SeatingType, Section } from "../../db/interface";
import {
  RoleDbInterface,
  SeatTypeDbInterface,
  SeatingTypeDbInterface,
  SectionDbInterface,
  UserPermissionDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { Actions, Loglevel } from "../../context";
import { defaultTruePermission } from "../../@types/userPermission";

export const creatDefaultRecords = async (
  outletId: number,
  userId: number,
  uniqueId: string,
  sequelize: Sequelize
): Promise<void> => {
  try {
    const moduleName = "creatDefaultRecords";

    const mealType: Section[] = [
      {
        name: "Breakfast",
        description: "Morning Food",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Lunch",
        description: "Lunch Food",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Dinner",
        description: "Dinner Food",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Wine Session",
        description: "Wine is Everything",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Dessert",
        description: "Room for Desserts",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Brunch",
        description: "Food for the Busy Geeks",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
    ];

    const spaceTypes: SeatingType[] = [
      {
        name: "Indoor",
        description: "Indoor",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Outdoor",
        description: "Outdoor",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Private Room",
        description: "Private Room",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
    ];

    const seatType: SeatType[] = [
      {
        name: "Window",
        description: "Window",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Booth Seats",
        description: "Booth Seats",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
    ];

    const roles: Role[] = [
      {
        name: "Management",
        description: "Management",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Marketing Sales",
        description: "Marketing Sales",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Administrator",
        description: "Administrator",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Corporate Affairs",
        description: "Corporate Affairs",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Operations Manager",
        description: "Operations Manager",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
      {
        name: "Finance Admin",
        description: "Finance Admin",
        outletId,
        createdBy: userId,
        updatedBy: userId,
      },
    ];

    const sectionDbInterface = new SectionDbInterface(sequelize);
    const seatingTypeDbInterface = new SeatingTypeDbInterface(sequelize);
    const seatTypeDbInterface = new SeatTypeDbInterface(sequelize);
    const roleDbInterface = new RoleDbInterface(sequelize);
    const userPermissionDbInterface = new UserPermissionDbInterface(sequelize);

    //Create Bulk MealType
    const createMealTypes = await sectionDbInterface.repository.bulkCreate(
      mealType as any
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      createMealTypes,
      uniqueId
    );

    //Create Bulk Spaces
    const createSpaceTypes = await seatingTypeDbInterface.repository.bulkCreate(
      spaceTypes as any
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      createSpaceTypes,
      uniqueId
    );

    //Create Bulk SeatType
    const createSeatTypes = await seatTypeDbInterface.repository.bulkCreate(
      seatType as any
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      createSeatTypes,
      uniqueId
    );

    //Create Bulk Roles
    const createRoles = await roleDbInterface.repository.bulkCreate(
      roles as any
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      createRoles,
      uniqueId
    );

    const creatPermission = await Promise.all(
      createRoles.map(async (role) => {
        const rolePermission = await userPermissionDbInterface.create(
          JSON.stringify(defaultTruePermission),
          role.id,
          outletId,
          userId
        );

        return rolePermission;
      })
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      creatPermission,
      uniqueId
    );
  } catch (error) {
    throw error;
  }
};
