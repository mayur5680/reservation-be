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
import { CreateOutletBasicInfoPayload } from "../../@types/outletInformation";
import { getGuid } from "../../context/service";
import {
  UserDbInterface,
  OutletDbInterface,
  OutletSeatingTypeDbInterface,
  OutletSeatTypeDbInterface,
  OutletTableDbInterface,
} from "../../db-interfaces";

import { Log } from "../../context/Logs";
import { getAdminUser } from "../shared";

const moduleName = "Outlet Basic Information";

export const createBasicInfo = async (
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

    const createOutletBasicInfoPayload: CreateOutletBasicInfoPayload = body;

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

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );

    const outletSeatTypeDbInterface = new OutletSeatTypeDbInterface(sequelize);

    const outletSeatingType = await outletSeatingTypeDbInterface.create(
      createOutletBasicInfoPayload.seatingType,
      outlet.id,
      user.id
    );

    const OutletSeatType = await outletSeatTypeDbInterface.create(
      createOutletBasicInfoPayload.seatType,
      outlet.id,
      user.id
    );

    const response = {
      OutletSeatingType: outletSeatingType,
      OutletSeatType: OutletSeatType,
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Basic Information Added Successfully",
        data: response,
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

export const getBasicInfo = async (
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
    const outletId = params.outletId;

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

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );

    const outletSeatTypeDbInterface = new OutletSeatTypeDbInterface(sequelize);

    const outletSeatingType =
      await outletSeatingTypeDbInterface.getAllOutletSeatingType(outlet.id);

    const OutletSeatType = await outletSeatTypeDbInterface.getAllOutletSeatType(
      outlet.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      outletSeatingType,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: {
          OutletSeatingType: outletSeatingType,
          OutletSeatType: OutletSeatType,
        },
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

export const updateBasicInfo = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.UPDATED, body, uniqueId);

    const outletId = params.outletId;
    const userId = decoded.userDetail.id;

    const createOutletBasicInfoPayload: CreateOutletBasicInfoPayload = body;

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

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );

    const outletSeatTypeDbInterface = new OutletSeatTypeDbInterface(sequelize);
    const outletTableDbInterface = new OutletTableDbInterface(sequelize);

    const seatingTypes =
      await outletSeatingTypeDbInterface.getAllOutletSeatingType(outlet.id);

    const mappedSeatingType = seatingTypes.filter((seatingType) => {
      if (
        !createOutletBasicInfoPayload.seatingType.find(
          (seatingId) => seatingId === seatingType.seatingTypeId
        )
      )
        return seatingType;
      return null;
    });

    const seatingTypesIds = mappedSeatingType.map((seatingType) => {
      return seatingType.id;
    });

    //delete outletSeatingType
    await outletSeatingTypeDbInterface.deleteOutletSeatingType(
      seatingTypesIds,
      outletTableDbInterface
    );

    const seatTypes = await outletSeatTypeDbInterface.getAllOutletSeatType(
      outlet.id
    );

    const mappedSeatType = seatTypes.filter((seatType) => {
      if (
        !createOutletBasicInfoPayload.seatType.find(
          (seatId) => seatId === seatType.seatTypeId
        )
      )
        return seatType;
      return null;
    });

    const seatTypesIds = mappedSeatType.map((seatType) => {
      return seatType.id;
    });

    //delete outletSeatType
    await outletSeatTypeDbInterface.deleteOutletSeatType(
      seatTypesIds,
      outletTableDbInterface
    );

    const outletSeatingType = await outletSeatingTypeDbInterface.create(
      createOutletBasicInfoPayload.seatingType,
      outlet.id,
      user.id
    );

    const OutletSeatType = await outletSeatTypeDbInterface.create(
      createOutletBasicInfoPayload.seatType,
      outlet.id,
      user.id
    );

    const response = {
      OutletSeatingType: outletSeatingType,
      OutletSeatType: OutletSeatType,
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Basic Information Updated Successfully",
        data: response,
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
