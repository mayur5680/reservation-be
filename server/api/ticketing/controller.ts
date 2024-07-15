import { Response, NextFunction } from "express";
import multer from "multer";
import {
  CreateTicketingPayload,
  sequelizeValidate,
  UpdateTicketingPayload,
} from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  LogTypes,
  Loglevel,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import { Ticketing } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  TicketingDbInterface,
  CompanyDbInterface,
} from "../../db-interfaces";
import { imageLocation } from "../../config";
import { Log } from "../../context/Logs";
import {
  contentChanges,
  getAdminUser,
  getUpdateBy,
  payloadValidation,
} from "../shared";
import { TicketingFilter } from "../../@types/ticketing";
import { ContentChangesPayload } from "../../@types/customer";
let moment = require("moment-timezone");

const moduleName = "Ticketing";

//File Upload
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageLocation.ticketingFilePath);
  },
  filename: (req, file, cb) => {
    const getExtension = file.originalname.toString().split(".")[1];
    cb(null, getGuid() + "." + getExtension); //Appending .jpg
  },
});

export const upload = multer({
  storage: fileStorageEngine,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
  limits: { fileSize: 5000000 },
}).single("image");

//Create Ticket
export const createTicketing = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, params, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const outletId = params.outletId;
    const userId = decoded.userDetail.id;

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

    const ticketingPayload: Ticketing = body;

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.ticketingFilePath, "images/")
        .replace(/\s/g, "");

      ticketingPayload.image = image;
    }

    const ticketingDbInterface = new TicketingDbInterface(sequelize);

    ticketingPayload.outletId = outlet.id;

    payloadValidation(CreateTicketingPayload, ticketingPayload);

    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const startDate = new Date(
      moment(ticketingPayload.startDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day")
    );

    const endDate = new Date(
      moment(ticketingPayload.endDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day")
    );

    ticketingPayload.startDate = startDate;
    ticketingPayload.endDate = endDate;

    const ticket = await ticketingDbInterface.create(ticketingPayload, userId);

    const response = {
      ...ticket.toJSON(),
      updatedBy: getUpdateBy(user),
    };

    let contentChangesPayload: ContentChangesPayload = {
      name: response.name ? response.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

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
      outlet,
      contentChange
    );
    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Ticket Created Successfully",
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

//Get All Ticket
export const getAllTicketing = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      { params, body },
      uniqueId
    );
    const outletId = params.outletId;

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    const ticketingPayload: TicketingFilter = body;

    let query: any = {
      outletId: outlet.id,
    };

    if (ticketingPayload.isActive) {
      query.isActive = true;
    }

    const ticketingDbInterface = new TicketingDbInterface(sequelize);
    const ticketing = await ticketingDbInterface.getAllTicketByOutletId(query);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      ticketing,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: ticketing,
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

//Update Ticket By Id
export const updateTicketing = async (
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
    const { ticketId, outletId } = params;

    const userId = decoded.userDetail.id;

    const ticketingPayload: Ticketing = body;

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

    const ticketingDbInterface = new TicketingDbInterface(sequelize);
    const ticket = await ticketingDbInterface.getTicketById(ticketId, false);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Ticket Found",
      uniqueId
    );

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.ticketingFilePath, "images/")
        .replace(/\s/g, "");

      ticketingPayload.image = image;
    }

    payloadValidation(UpdateTicketingPayload, ticketingPayload);

    const startDate = new Date(
      moment(ticketingPayload.startDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day")
    );

    const endDate = new Date(
      moment(ticketingPayload.endDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day")
    );

    ticketingPayload.startDate = startDate;
    ticketingPayload.endDate = endDate;

    const updatedTicket = await ticketingDbInterface.updateTicket(
      ticket.id,
      ticketingPayload,
      userId
    );

    const contentChange = contentChanges(
      ticket.toJSON(),
      updatedTicket.toJSON()
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedTicket,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Ticket Updated Successfully",
        data: updatedTicket,
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

//Delete Ticket By Id
export const deleteTicketing = async (
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
    const { ticketId, outletId } = params;
    Log.writeLog(Loglevel.INFO, moduleName, Actions.DELETED, params, uniqueId);

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

    const ticketingDbInterface = new TicketingDbInterface(sequelize);

    const deletedTicket = await ticketingDbInterface.deleteTicket(
      ticketId,
      userId
    );

    let contentChangesPayload: ContentChangesPayload = {
      name: deletedTicket.name ? deletedTicket.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      ticketId,
      deletedTicket,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Ticket Deleted Successfully",
        data: deletedTicket.id,
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

//Get All Ticket by company key
export const getAllTicketingByCompanyKey = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);

    const { key } = params;

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const comapany = await companyDbInterface.getcompanyByKey(key);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Company Found",
      uniqueId
    );

    const ticketingDbInterface = new TicketingDbInterface(sequelize);
    const ticketings = await ticketingDbInterface.getAllTicketByCompanyKey(
      comapany.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      ticketings,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: ticketings,
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
