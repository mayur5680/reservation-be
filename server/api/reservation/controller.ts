import { Response, NextFunction } from "express";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Loglevel,
  Actions,
  LogTypes,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { getGuid } from "../../context/service";
import {
  OutletDbInterface,
  OutletTagDbInterface,
  CompanyDbInterface,
  DiningOptionDbInterface,
  TableSectionDbInterface,
  PaymentDbInterface,
  TicketingDbInterface,
  OutletInvoiceDbInterface,
} from "../../db-interfaces";
import {
  GetOutlets,
  OutletInfoRequest,
  OutletTimeSlotInfo,
  BookTablePayload,
  FutureTradingHours,
  Step4Payload,
} from "../../@types/customerBooking";
import { Log } from "../../context/Logs";
import {
  getFormattedTradingHoursAndTimeslots,
  CustomerBooking,
  checkTableAvailbility,
  getOutletDateTime,
  getTradingHoursBydate,
  getTradingHours,
  getTimeSlotCoupon,
  getAdminUser,
  getAllInvoiceByDate,
  getMenuInStep4,
  checkTablesForReseration,
  checkTablesForTicketing,
  CustomerBookingForTicketing,
  getAvaliblePrivateRoom,
  convertMinutes,
} from "../shared";
import {
  DiningOptionDbModel,
  OutletDbModel,
  OutletInvoiceDbModel,
  OutletTimeSlotOverrideDbModel,
  PaymentDbModel,
} from "../../db/models";
import { Moment } from "moment";
import { dayMaxQtyDiningOption } from "../shared/diningOption";
import {
  createPaymentIntents,
  getStripeCheckoutSession,
  getStripeSetupIntent,
} from "../stripePayment";
let moment = require("moment-timezone");

//Get All Outlets
export const getAllOutlet = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { sequelize } = req;
    sequelizeValidate(sequelize, res);

    const outletDbInterface = new OutletDbInterface(sequelize);

    const Outlets = await outletDbInterface.getAllOutletsForCustomer();

    const outletTagDbInterface = new OutletTagDbInterface(sequelize);

    let response: GetOutlets[] = [];

    await Promise.all(
      Outlets.map(async (outlet) => {
        const outletResponse = outlet.toJSON();
        const currentOutletTime = moment().tz(outlet.timezone);
        const timeSlotOverrides: OutletTimeSlotOverrideDbModel[] = [];
        outlet.OutletTimeSlotOverride?.map((timeSlotOverride) => {
          if (
            currentOutletTime.isBetween(
              timeSlotOverride.effectiveFrom,
              timeSlotOverride.effectiveTo
            )
          )
            timeSlotOverrides.push(timeSlotOverride);
        });
        outlet.OutletTimeSlotOverride = timeSlotOverrides;
        delete outletResponse.OutletTimeSlot;
        delete outletResponse.OutletTimeSlotOverride;
        const getOutlets: GetOutlets = {
          ...outletResponse,
          TradingHours: getFormattedTradingHoursAndTimeslots(outlet),
          OutletTag: await outletTagDbInterface.getAllOutletTag(outlet.id),
        };
        response.push(getOutlets);
      })
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: response,
      })
    );
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};

//Get Outlet Time Slot
export const step2 = async (
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
      "Step-2",
      Actions.GET,
      { params, body },
      uniqueId
    );

    const companyKey = params.key;

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const comapany = await companyDbInterface.getcompanyByKey(companyKey);

    const outletInfoRequest: OutletInfoRequest = body;

    const noOfPerson =
      Number(outletInfoRequest.noOfAdult) + Number(outletInfoRequest.noOfChild);

    const outletDbInterface = new OutletDbInterface(sequelize);
    let outletTimeSlotInfos: OutletTimeSlotInfo[] = [];
    if (comapany.Outlet) {
      await Promise.all(
        comapany.Outlet.map(async (outlet) => {
          const requestDate = getOutletDateTime(
            outlet.timezone,
            outletInfoRequest.preferredTime,
            outletInfoRequest.date
          );

          const currentOutletTime = moment().tz(outlet.timezone);

          const checkdate = requestDate.isBefore(currentOutletTime);
          if (checkdate) {
            throw new ApiError({
              message: Exceptions.INVALID_DATE_TIME,
              statusCode: StatusCode.BAD_REQUEST,
            });
          }

          const dayofweek = requestDate.format("dddd");

          const checkOutlet = await outletDbInterface.getOutletsForTimeSlot(
            outlet.id
          );

          Log.writeLog(
            Loglevel.INFO,
            "Step-2",
            Actions.GET,
            "Outlet Found",
            uniqueId
          );

          //check Availibility of table
          const isValidTableRequest = await checkTableAvailbility(
            noOfPerson,
            outlet.id,
            sequelize
          );

          Log.writeLog(
            Loglevel.INFO,
            "Step-2",
            Actions.GET,
            "Valid Request",
            uniqueId
          );

          let tradingHours = await getTradingHours(
            checkOutlet,
            outletInfoRequest,
            dayofweek,
            sequelize,
            uniqueId,
            true
          );
          Log.writeLog(
            Loglevel.INFO,
            "Step-2",
            Actions.GET,
            "Trading Hours Found",
            uniqueId
          );

          tradingHours = getFormatedTimeSlot(
            tradingHours,
            outlet,
            currentOutletTime,
            requestDate,
            outletInfoRequest
          );

          Log.writeLog(
            Loglevel.INFO,
            "Step-2",
            Actions.GET,
            "Formated TimeSlot Found",
            uniqueId
          );

          const discountTimeSlot = await getTimeSlotCoupon(
            tradingHours,
            outletInfoRequest,
            outlet,
            sequelize,
            uniqueId
          );
          Log.writeLog(
            Loglevel.INFO,
            "Step-2",
            Actions.GET,
            "Discounted TimeSlot Found",
            uniqueId
          );

          const futureDate = moment(outletInfoRequest.date, "DD-MM-YYYY")
            .tz(outlet.timezone)
            .add(1, "days");

          outletTimeSlotInfos.push({
            ...outlet.toJSON(),
            tradingHours,
            discountTimeSlot,
            isValidTableRequest: isValidTableRequest,
            finalFutureTradingHours: getTradingHoursBydate(
              checkOutlet,
              futureDate
            ),
          });
        })
      );
    }

    //check all outlet has table capacity or not
    const isValidTableRequest = outletTimeSlotInfos.filter(
      (outletTimeSlot) => outletTimeSlot.isValidTableRequest === true
    );
    if (isValidTableRequest.length === 0) {
      throw new ApiError({
        message: Exceptions.INVALID_TABLE_CAPACITY,
        statusCode: StatusCode.NOTFOUND,
      });
    }

    Log.writeExitLog(
      Loglevel.INFO,
      "GetOutletInfo",
      Actions.GET,
      params,
      outletTimeSlotInfos,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    const selectedOutlet = outletTimeSlotInfos.find(
      (outlet) => outlet.id == outletInfoRequest.outletId
    );
    const otherOutlets = outletTimeSlotInfos.filter(
      (outlet) => outlet.id != outletInfoRequest.outletId
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: {
          selectedOutlet,
          otherOutlets,
        },
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "GetOutletInfo",
      Actions.GET,
      { params, body },
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

export const step4 = async (
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
      "Step-4",
      Actions.GET,
      { params, body },
      uniqueId
    );

    const outletId = params.outletId;

    const outletDbInterface = new OutletDbInterface(sequelize);

    const outlet = await outletDbInterface.getOutletsForTimeSlot(outletId);
    Log.writeLog(
      Loglevel.INFO,
      "Step-4",
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    const step4Payload: Step4Payload = body;

    const currentOutletTime = moment().tz(outlet.timezone);

    const requestDate = moment(step4Payload.date, "DD-MM-YYYY")
      .tz(outlet.timezone)
      .startOf("day");

    const startDateTime = getOutletDateTime(
      outlet.timezone,
      step4Payload.exactTime,
      step4Payload.date
    );

    const endDateTime = moment(startDateTime)
      .add(outlet.rebookingTableInterval, "minutes")
      .subtract(1, "minutes");

    const weekName = requestDate.format("dddd");

    const noOfPerson =
      Number(step4Payload.noOfAdult) + Number(step4Payload.noOfChild);

    const getInvoices = await getAllInvoiceByDate(
      step4Payload.date,
      outlet,
      sequelize,
      uniqueId
    );

    const availablePrivateRoom = await getAvaliblePrivateRoom(
      outlet,
      noOfPerson,
      currentOutletTime,
      startDateTime,
      endDateTime,
      sequelize,
      uniqueId
    );

    const diningOptionDbInterface = new DiningOptionDbInterface(sequelize);
    let diningOptions =
      await diningOptionDbInterface.getAllDiningOptionForBooking(
        outlet.id,
        weekName
      );

    Log.writeLog(
      Loglevel.INFO,
      "Step-4",
      "Dining Options Found",
      diningOptionDbInterface,
      uniqueId
    );

    const getAlldiningOptions = await Promise.all(
      diningOptions.map(async (diningOption: DiningOptionDbModel) => {
        const count = await dayMaxQtyDiningOption(
          diningOption,
          getInvoices,
          uniqueId
        );

        let dailyTotalQtyleft =
          Number(diningOption.dailyMaxQty) - Number(count);

        let isEnable = true;
        let message = "";

        const blockedTime = moment(currentOutletTime).add(
          diningOption.blockTime,
          "minutes"
        );

        const leadTime = moment(currentOutletTime).add(
          diningOption.leadTime,
          "minutes"
        );

        const checktime = startDateTime.isBefore(blockedTime);
        if (checktime) {
          dailyTotalQtyleft = 0;
        }

        const checkLeadTime = startDateTime.isBefore(leadTime);

        if (checkLeadTime) {
          isEnable = false;
          const diff = leadTime.diff(startDateTime, "minutes");
          message = convertMinutes(diningOption.leadTime);
        }

        if (
          diningOption.overridePrivateRoom &&
          availablePrivateRoom.length === 0
        ) {
          dailyTotalQtyleft = 0;
        }

        return {
          ...diningOption.toJSON(),
          dailyTotalQtyleft,
          isEnable,
          message,
        };
      })
    );

    const menu = await getMenuInStep4(
      requestDate,
      outlet,
      getInvoices,
      startDateTime,
      currentOutletTime,
      uniqueId,
      sequelize
    );

    const response = {
      diningOptions: getAlldiningOptions,
      menu,
      privateRoom: availablePrivateRoom,
    };

    Log.writeExitLog(
      Loglevel.INFO,
      "Step-4",
      Actions.GET,
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
        data: response,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "Step-4",
      Actions.GET,
      { params, body },
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

export const bookTable = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const moduleName = "Customer side Booking";
  const uniqueId = getGuid();
  const { sequelize, params, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    const outletId = params.id;

    const bookTablePayload: BookTablePayload = body;
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "bookTable",
      bookTablePayload,
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

    //check table availbility
    const customerBookingPayload = await checkTablesForReseration(
      bookTablePayload,
      outlet,
      uniqueId,
      sequelize
    );

    //creating invoice or payemnt token
    const customerBooking = await CustomerBooking(
      customerBookingPayload,
      bookTablePayload,
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
      Actions.GET,
      { params, body },
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

export const stripeWebhook = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const moduleName = "Stripe Webhook";
  const uniqueId = getGuid();
  const { sequelize, body } = req;
  sequelizeValidate(sequelize, res);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, body, uniqueId);

    const requestBody = body;
    const sessionId = requestBody.data.object.id;

    //retrive a checkout session via stripe
    const stripeSession = await getStripeCheckoutSession(sessionId, uniqueId);

    //retrive a checkout session via stripe
    const stripeSetupIntent = await getStripeSetupIntent(
      stripeSession.setup_intent as string,
      uniqueId
    );

    const paymentDbInterface = new PaymentDbInterface(sequelize);
    const payment = await paymentDbInterface.getPaymentBySessionId(sessionId);
    Log.writeLog(Loglevel.INFO, moduleName, "payment", payment, uniqueId);

    const bookTablePayload = JSON.parse(payment.request);

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(payment.outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    let customerBooking: OutletInvoiceDbModel | PaymentDbModel | null = null;

    //check booking is of normal reservation or event
    if (payment.is_Event === false) {
      //check table availbility
      const customerBookingPayload = await checkTablesForReseration(
        bookTablePayload,
        outlet,
        uniqueId,
        sequelize
      );

      //creating invoice or payemnt token
      customerBooking = await CustomerBooking(
        customerBookingPayload,
        bookTablePayload,
        sequelize,
        uniqueId,
        false
      );

      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        "customerBooking",
        customerBooking,
        uniqueId
      );
    } else {
      const ticketingDbInterface = new TicketingDbInterface(sequelize);
      const ticket = await ticketingDbInterface.getTicketById(
        payment.ticketingId
      );
      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        Actions.UPDATED,
        "Ticket Found",
        uniqueId
      );

      const customerBookingPayload = await checkTablesForTicketing(
        ticket,
        bookTablePayload,
        outlet,
        uniqueId,
        sequelize
      );

      //creating invoice or payemnt token
      customerBooking = await CustomerBookingForTicketing(
        customerBookingPayload,
        bookTablePayload,
        sequelize,
        uniqueId,
        false
      );

      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        "customerBooking",
        customerBooking,
        uniqueId
      );
    }

    if (customerBooking instanceof OutletInvoiceDbModel) {
      customerBooking.stripeSetupIntentId = stripeSetupIntent.id;
      customerBooking.stripePaymentMethodId =
        stripeSetupIntent.payment_method as string;

      customerBooking.isValidSetupIntent = true;

      await customerBooking.save();

      payment.outletInvoiceId = customerBooking.id;
      payment.is_Success = true;
      await payment.save();

      ///direct payment
      if (bookTablePayload.directPayment) {
        await createPaymentIntents(customerBooking, sequelize, uniqueId);
      }
    }

    return res.status(StatusCode.SUCCESS).send();
  } catch (error) {
    Log.writeLog(Loglevel.ERROR, moduleName, "error", error, uniqueId);
    return catchErrorResponse(error, res);
  }
};

export const retriveInvoiceBySession = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const moduleName = "Invoice By Session";
  const uniqueId = getGuid();
  const { sequelize, params } = req;
  sequelizeValidate(sequelize, res);
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, { params }, uniqueId);

    const { sessionId } = params;

    const paymentDbInterface = new PaymentDbInterface(sequelize);
    const payment = await paymentDbInterface.getPaymentBySessionId(sessionId);
    Log.writeLog(Loglevel.INFO, moduleName, "payment", payment, uniqueId);

    if (!payment.outletInvoiceId) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Invoice not found",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const getInvoice = (
      await outletInvoiceDbInterface.getInvoiceById(payment.outletInvoiceId)
    ).toJSON();

    Log.writeLog(Loglevel.INFO, moduleName, "getInvoice", getInvoice, uniqueId);

    const response = {
      ...getInvoice,
      image: getInvoice.image ? JSON.parse(getInvoice.image) : getInvoice.image,
      dietaryRestriction: getInvoice.dietaryRestriction
        ? JSON.parse(getInvoice.dietaryRestriction)
        : [],
      basket: getInvoice.basket ? JSON.parse(getInvoice.basket) : [],
      dinningOptions: getInvoice.dinningOptions
        ? JSON.parse(getInvoice.dinningOptions)
        : [],
    };

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: response,
      })
    );
  } catch (error) {
    Log.writeLog(Loglevel.ERROR, moduleName, "error", error, uniqueId);
    return catchErrorResponse(error, res);
  }
};

const getFormatedTimeSlot = (
  tradingHours: FutureTradingHours[],
  outlet: OutletDbModel,
  currentOutletTime: any,
  requestDate: any,
  outletInfoRequest: OutletInfoRequest
): FutureTradingHours[] => {
  const result = tradingHours.map((tradingHour) => {
    const finalTimeSlots: string[] = [];
    const { timeSlots } = tradingHour;
    let requestedDate: undefined | Date = undefined;

    if (!requestDate.isSame(moment().tz(outlet.timezone), "day")) {
      requestedDate = outletInfoRequest.date;
    }

    let findExactTime = timeSlots?.find(
      (timeSlot) => timeSlot === outletInfoRequest.preferredTime
    );
    if (!findExactTime) {
      timeSlots?.map((timeSlot) => {
        const timeSlotDate = getOutletDateTime(outlet.timezone, timeSlot);
        const exactDate = getOutletDateTime(
          outlet.timezone,
          outletInfoRequest.preferredTime
        );

        const timeDiff = timeSlotDate.diff(exactDate);
        if (timeDiff > 0 && !findExactTime) {
          findExactTime = timeSlot;
        }
      });
    }

    timeSlots?.find((timeSlot, index) => {
      if (timeSlot === findExactTime) {
        if (
          timeSlots[index - 3] &&
          checkTimeSlot(
            timeSlots[index - 3],
            outlet.timezone,
            currentOutletTime,
            requestedDate
          )
        )
          finalTimeSlots.push(timeSlots[index - 3]);

        if (
          timeSlots[index - 2] &&
          checkTimeSlot(
            timeSlots[index - 2],
            outlet.timezone,
            currentOutletTime,
            requestedDate
          )
        )
          finalTimeSlots.push(timeSlots[index - 2]);

        if (
          timeSlots[index - 1] &&
          checkTimeSlot(
            timeSlots[index - 1],
            outlet.timezone,
            currentOutletTime,
            requestedDate
          )
        )
          finalTimeSlots.push(timeSlots[index - 1]);
        finalTimeSlots.push(timeSlot);

        if (
          timeSlots[index + 1] &&
          checkTimeSlot(
            timeSlots[index + 1],
            outlet.timezone,
            currentOutletTime,
            requestedDate
          )
        )
          finalTimeSlots.push(timeSlots[index + 1]);
        if (
          timeSlots[index + 2] &&
          checkTimeSlot(
            timeSlots[index + 2],
            outlet.timezone,
            currentOutletTime,
            requestedDate
          )
        )
          finalTimeSlots.push(timeSlots[index + 2]);
        if (
          timeSlots[index + 3] &&
          checkTimeSlot(
            timeSlots[index + 3],
            outlet.timezone,
            currentOutletTime,
            requestedDate
          )
        )
          finalTimeSlots.push(timeSlots[index + 3]);
        if (
          timeSlots[index + 4] &&
          checkTimeSlot(
            timeSlots[index + 4],
            outlet.timezone,
            currentOutletTime,
            requestedDate
          )
        )
          finalTimeSlots.push(timeSlots[index + 4]);
      }
    });

    return { ...tradingHour, timeSlots: finalTimeSlots };
  });
  return result;
};

const checkTimeSlot = (
  time: string,
  timezone: string,
  currentOutletTime: Moment,
  requestedDate?: Date
): Boolean => {
  const dateTime = getOutletDateTime(timezone, time, requestedDate);

  if (dateTime.isSameOrAfter(currentOutletTime)) {
    return true;
  }

  return false;
};
