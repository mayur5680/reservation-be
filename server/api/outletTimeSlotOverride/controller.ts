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
import { OutletTimeSlotOverride } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  OutletTimeSlotOverrideDbInterface,
  SectionDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { contentChanges, getAdminUser, getUpdateBy } from "../shared";
import { ContentChangesPayload } from "../../@types/customer";
let moment = require("moment-timezone");

const moduleName = "Closure";

export const createOverideTimeSlot = async (
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

    const outletTimeSlotOverride: OutletTimeSlotOverride = body;
    outletTimeSlotOverride.outletId = outletId;

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
      outletTimeSlotOverride.sectionId
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

    const dayOfWeekName = moment()
      .day(outletTimeSlotOverride.dayofweek)
      .format("dddd");

    const effectiveFrom = new Date(
      moment(outletTimeSlotOverride.effectiveFrom, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day")
    );

    const effectiveTo = new Date(
      moment(outletTimeSlotOverride.effectiveTo, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day")
    );

    outletTimeSlotOverride.effectiveFrom = effectiveFrom;
    outletTimeSlotOverride.effectiveTo = effectiveTo;

    const outletTimeSlotOverrideDbInterface =
      new OutletTimeSlotOverrideDbInterface(sequelize);

    const overrideTimeSlot = (
      await outletTimeSlotOverrideDbInterface.create(
        outletTimeSlotOverride,
        userId
      )
    ).toJSON();

    let contentChangesPayload: ContentChangesPayload = {
      name: overrideTimeSlot.name ? overrideTimeSlot.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      overrideTimeSlot,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Meal TimeSlot Override Added Successfully",
        data: {
          ...overrideTimeSlot,
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

export const getAllTimeSlotOverride = async (
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

    const outletTimeSlotOverrideDbInterface =
      new OutletTimeSlotOverrideDbInterface(sequelize);
    const timeSlots =
      await outletTimeSlotOverrideDbInterface.getAllOverrideTimeSlot(outlet.id);

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

export const updateTimeSlotOverride = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.UPDATED, body, uniqueId);
    const { timeslotId, outletId } = params;

    const userId = decoded.userDetail.id;
    const outletTimeSlotOverride: OutletTimeSlotOverride = body;

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

    const outletTimeSlotOverrideDbInterface =
      new OutletTimeSlotOverrideDbInterface(sequelize);

    const overRideTimeSlot =
      await outletTimeSlotOverrideDbInterface.getOutletOverrideTimeSlotbyId(
        timeslotId,
        outlet.id,
        false
      );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Override Time Found",
      uniqueId
    );

    const sectionDbInterface = new SectionDbInterface(sequelize);
    const section = await sectionDbInterface.getSectionById(
      outletTimeSlotOverride.sectionId
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

    const dayOfWeekName = moment()
      .day(outletTimeSlotOverride.dayofweek)
      .format("dddd");

    const effectiveFrom = new Date(
      moment(outletTimeSlotOverride.effectiveFrom, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day")
    );

    const effectiveTo = new Date(
      moment(outletTimeSlotOverride.effectiveTo, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day")
    );

    outletTimeSlotOverride.effectiveFrom = effectiveFrom;
    outletTimeSlotOverride.effectiveTo = effectiveTo;

    const UpdatedTimeSlotOverride = (
      await outletTimeSlotOverrideDbInterface.updateOverrideTimeSlot(
        timeslotId,
        outlet.id,
        outletTimeSlotOverride,
        userId
      )
    ).toJSON();

    const contentChange = contentChanges(
      overRideTimeSlot.toJSON(),
      UpdatedTimeSlotOverride
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      UpdatedTimeSlotOverride,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Meal Override TimeSlot Updated Successfully",
        data: { ...UpdatedTimeSlotOverride, dayOfWeekName, Section: section },
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

export const deleteTimeSlotOverride = async (
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
    const outletTimeSlotOverrideDbInterface =
      new OutletTimeSlotOverrideDbInterface(sequelize);
    const deletedTimeSlotOverride =
      await outletTimeSlotOverrideDbInterface.deleteTimeSlotOverride(
        timeslotId,
        outlet.id,
        userId
      );

    let contentChangesPayload: ContentChangesPayload = {
      name: deletedTimeSlotOverride.Section?.name
        ? deletedTimeSlotOverride.Section.name
        : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      timeslotId,
      deletedTimeSlotOverride,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Meal TimeSlotOverride Deleted Successfully",
        data: deletedTimeSlotOverride.id,
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
