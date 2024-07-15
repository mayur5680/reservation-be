import { Response, NextFunction } from "express";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  LogTypes,
  Loglevel,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import { OutletTimeSlot } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  OutletTimeSlotDbInterface,
  SectionDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { contentChanges, getAdminUser, getUpdateBy } from "../shared";
import { ContentChangesPayload } from "../../@types/customer";

let moment = require("moment-timezone");

const moduleName = "MealTiming";

export const createTimeSlot = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const outletId = params.outletId;
    const userId = decoded.userDetail.id;

    const outletTimeSlot: OutletTimeSlot = body;
    outletTimeSlot.outletId = outletId;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Outlet Found",
      uniqueId
    );

    const sectionDbInterface = new SectionDbInterface(sequelize);
    const section = await sectionDbInterface.getSectionById(
      outletTimeSlot.sectionId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Section Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const dayOfWeekName = moment().day(outletTimeSlot.dayofweek).format("dddd");
    const outletTimeSlotDbInterface = new OutletTimeSlotDbInterface(sequelize);
    const createTimeSlot = (
      await outletTimeSlotDbInterface.create(outletTimeSlot, userId)
    ).toJSON();

    let contentChangesPayload: ContentChangesPayload = {
      name: section.name ? section.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      createTimeSlot,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Meal TimeSlot Added Successfully",
        data: {
          ...createTimeSlot,
          updatedBy: getUpdateBy(user),
          dayOfWeekName,
          Section: section,
        },
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.CREATED,
      body,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

//Get All Meal Time Slot
export const getAllTimeSlot = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);

    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const outletTimeSlotDbInterface = new OutletTimeSlotDbInterface(sequelize);
    let timeSlots = await outletTimeSlotDbInterface.getAllTimeSlot(outlet.id);

    const getResponse = timeSlots.map((singleTimeSlot) => {
      return {
        ...singleTimeSlot.toJSON(),
        dayOfWeekName: moment().day(singleTimeSlot.dayofweek).format("dddd"),
      };
    });
    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      getResponse,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getResponse,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
      params,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

//Update OutletTimeSlot By Id
export const updateTimeSlot = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body, decoded, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    const { timeslotId, outletId } = params;

    const userId = decoded.userDetail.id;
    const outletTimeSlot: OutletTimeSlot = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Outlet Found",
      uniqueId
    );

    const outletTimeSlotDbInterface = new OutletTimeSlotDbInterface(sequelize);
    const timeSlot =
      await outletTimeSlotDbInterface.getOutletTimeSlotbyIdAndOutletId(
        timeslotId,
        outlet.id,
        false
      );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "timeSlot Found",
      uniqueId
    );

    const sectionDbInterface = new SectionDbInterface(sequelize);
    const section = await sectionDbInterface.getSectionById(
      outletTimeSlot.sectionId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Section Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const dayOfWeekName = moment().day(outletTimeSlot.dayofweek).format("dddd");

    const UpdatedTimeSlot = (
      await outletTimeSlotDbInterface.updateTimeSlot(
        timeslotId,
        outlet.id,
        outletTimeSlot,
        userId
      )
    ).toJSON();

    const contentChange = contentChanges(timeSlot.toJSON(), UpdatedTimeSlot);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      UpdatedTimeSlot,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Meal TimeSlot Updated Successfully",
        data: { ...UpdatedTimeSlot, dayOfWeekName, Section: section },
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.UPDATED,
      body,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

//Delete OutletTimeSlot By Id
export const deleteTimeSlot = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.DELETED, params, uniqueId);
    const { timeslotId, outletId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }
    const outletTimeSlotDbInterface = new OutletTimeSlotDbInterface(sequelize);
    const deletedTimeSlot = await outletTimeSlotDbInterface.deleteTimeSlot(
      timeslotId,
      outlet.id,
      userId
    );

    let contentChangesPayload: ContentChangesPayload = {
      name: deletedTimeSlot.Section?.name ? deletedTimeSlot.Section.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      timeslotId,
      deletedTimeSlot,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Meal TimeSlot Deleted Successfully",
        data: deletedTimeSlot.id,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.DELETED,
      params,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};
