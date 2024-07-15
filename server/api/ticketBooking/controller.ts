import { Response, NextFunction } from "express";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  Loglevel,
  LogTypes,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import { OutletDbInterface, TicketingDbInterface } from "../../db-interfaces";
import { Log } from "../../context/Logs";
import {
  BookTicketPayload,
  TicketTimeSlotRequest,
} from "../../@types/ticketBooking";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import {
  checkTablesForTicketing,
  CustomerBookingForTicketing,
  getAdminUser,
} from "../shared";
import { PaymentDbModel } from "../../db/models";
import { checkBookingTicket, ticketTimeSlot } from "../shared/ticketBooking";

let moment = require("moment-timezone");

const moduleName = "TicketingBooking";

//Get TimeSlot
export const getTimeSlot = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, "getTimeSlot", body, uniqueId);
    const { ticketId } = params;
    const ticketingDbInterface = new TicketingDbInterface(sequelize);
    const ticket = await ticketingDbInterface.getTicketById(ticketId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getTimeSlot",
      "Ticket Found",
      uniqueId
    );

    const ticketTimeSlotRequest: TicketTimeSlotRequest = body;

    const noOfPerson =
      Number(ticketTimeSlotRequest.noOfAdult) +
      Number(ticketTimeSlotRequest.noOfChild);

    //check ticket max qty
    if (ticket.ticketMaxQuantity < noOfPerson) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: `Maximum ${ticket.ticketMaxQuantity} pax is available for reservation,please reduce your pax and book again`,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //check Number of Person
    await checkBookingTicket(ticket, ticketTimeSlotRequest, sequelize);

    const timeSlots = await ticketTimeSlot(
      ticket,
      ticketTimeSlotRequest,
      sequelize,
      uniqueId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "getTimeSlot",
      body,
      timeSlots,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: timeSlots,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "getTimeSlot",
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

//Book ticket
export const bookTicket = async (
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
    sequelizeValidate(sequelize, res);
    const { ticketId } = params;

    const ticketingDbInterface = new TicketingDbInterface(sequelize);
    const ticket = await ticketingDbInterface.getTicketById(ticketId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Ticket Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    const outlet = await outletDbInterface.getOutletbyId(ticket.outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    const bookTicketPayload: BookTicketPayload = body;

    const customerBookingPayload = await checkTablesForTicketing(
      ticket,
      bookTicketPayload,
      outlet,
      uniqueId,
      sequelize
    );

    //customerBookingPayload

    const customerBooking = await CustomerBookingForTicketing(
      customerBookingPayload,
      bookTicketPayload,
      sequelize,
      uniqueId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      body,
      customerBooking,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    let statusCode = StatusCode.CREATED;

    if (customerBooking instanceof PaymentDbModel)
      statusCode = StatusCode.SUCCESS;

    return res.status(statusCode).send(
      new ApiResponse({
        message: "Table Reservation done successfull",
        data: customerBooking,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "getTimeSlot",
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
