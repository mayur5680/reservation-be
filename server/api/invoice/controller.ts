import { Response, NextFunction } from "express";
import { isEmpty } from "lodash";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Loglevel,
  Actions,
  BookingStatus,
  LogTypes,
  CustomerLogType,
  CustomerLogPageTitle,
  FrontEndBaseURL,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { FilterInvoice, UpdateInvoice } from "../../@types/outletInvoice";
import { getGuid } from "../../context/service";
import {
  CustomerLogsDbInterface,
  OutletDbInterface,
  OutletInvoiceDbInterface,
  OutletTableBookingDbInterface,
  UserDbInterface,
} from "../../db-interfaces";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { Log } from "../../context/Logs";
import { Op } from "sequelize";
import {
  calculateNoShowAndCancel,
  contentChanges,
  getAdminUser,
  updateInvoiceDateAndTable,
} from "../shared";
import { CustomerLogs } from "../../db/interface";
import { cancelIntents, createPaymentIntents } from "../stripePayment";
let moment = require("moment-timezone");

const moduleName = "ReservationManagement";

//Get Invoice
export const getInvoice = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);

    const invoiceId = params.id;

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const getInvoice = (
      await outletInvoiceDbInterface.getInvoiceById(invoiceId)
    ).toJSON();

    if (getInvoice.Customer && getInvoice.Outlet) {
      const noShowAndCancel = await calculateNoShowAndCancel(
        getInvoice.Customer,
        getInvoice.Outlet?.companyId,
        sequelize
      );

      const customer = {
        ...getInvoice.Customer,
        noShow: noShowAndCancel.noShow,
        cancelation: noShowAndCancel.cancelation,
      };

      getInvoice.Customer = customer;
    }

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

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
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

export const getInvoiceByFilter = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet: any = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetInvoiceByFilter",
      body,
      uniqueId
    );

    const userId = decoded.userDetail.id;
    const outletId = params.id;
    const isFutureOrder = params.isfuture === "true";

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
      "GetInvoiceByFilter",
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const invoiceFilter: FilterInvoice = body;
    let NormalDateStartDateTime: any = null;
    let NormalDateEndDateTime: any = null;

    if (invoiceFilter.date) {
      let startDayDateTime = moment(invoiceFilter.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day");

      let endDayDateTime = moment(invoiceFilter.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day");
      NormalDateStartDateTime = startDayDateTime;
      NormalDateEndDateTime = endDayDateTime;
    } else {
      let startDayDateTime = moment().tz(outlet.timezone).startOf("day");
      let endDayDateTime = moment().tz(outlet.timezone).endOf("day");

      NormalDateStartDateTime = startDayDateTime;
      NormalDateEndDateTime = endDayDateTime;
    }

    let query: any = {
      outletId: outlet.id,
    };

    if (isFutureOrder) {
      const outletCurrentTime = moment().tz(outlet.timezone);
      query.bookingEndTime = {
        [Op.gte]: new Date(outletCurrentTime),
      };
    }

    if (!isEmpty(invoiceFilter.mealType)) {
      query.mealType = invoiceFilter.mealType;
    }

    if (!isEmpty(invoiceFilter.status)) {
      query.status = invoiceFilter.status;
    }

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const getInvoices = (
      await outletInvoiceDbInterface.getInvoiceByFilter(query)
    ).map((invoice) => {
      return {
        ...invoice.toJSON(),
        image: invoice.image ? JSON.parse(invoice.image) : invoice.image,
        dietaryRestriction: invoice.dietaryRestriction
          ? JSON.parse(invoice.dietaryRestriction)
          : [],
        basket: invoice.basket ? JSON.parse(invoice.basket) : [],
        dinningOptions: invoice.dinningOptions
          ? JSON.parse(invoice.dinningOptions)
          : [],
      };
    });

    const filterInvoice = getInvoices.filter((invoice) => {
      const bookingStartTime = moment(invoice.bookingStartTime)
        .tz(outlet.timezone)
        .startOf("day");
      const bookingEndTime = moment(invoice.bookingEndTime)
        .tz(outlet.timezone)
        .endOf("day");
      if (
        NormalDateStartDateTime.isBetween(
          bookingStartTime,
          bookingEndTime,
          undefined,
          "[]"
        ) ||
        NormalDateEndDateTime.isBetween(
          bookingStartTime,
          bookingEndTime,
          undefined,
          "[]"
        )
      ) {
        return invoice;
      }
      return null;
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "GET InvoiceByFilter",
      body,
      filterInvoice,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: filterInvoice,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "GET InvoiceByFilter",
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

export const updateInvoiveStatus = async (
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
    const invoiceId = params.id;
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

    const updateInvoice: UpdateInvoice = body;

    if (updateInvoice.dietaryRestriction)
      updateInvoice.dietaryRestriction = JSON.stringify(
        updateInvoice.dietaryRestriction
      );

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    let invoice = await outletInvoiceDbInterface.getInvoiceById(invoiceId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Invoice Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(invoice.outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Outlet Found",
      uniqueId
    );

    const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
      sequelize
    );

    let query: any = {};

    const currentdate = new Date();
    if (updateInvoice.status === BookingStatus.SEATED) {
      (query.status = BookingStatus.SEATED),
        (query.seatStartTime = currentdate),
        (query.seatEndTime = null);
    } else if (updateInvoice.status === BookingStatus.LEFT) {
      (query.status = BookingStatus.LEFT), (query.seatEndTime = currentdate);
    } else {
      query.status = updateInvoice.status;
    }

    if (updateInvoice.tableChangeRequest) {
      invoice = await updateInvoiceDateAndTable(
        updateInvoice.tableChangeRequest,
        invoice,
        outlet,
        sequelize,
        uniqueId
      );
    }

    //Update OutletTable Booking Status
    await outletTableBookingDbInterface.UpdateStatusByInvoiceId(
      invoice.id,
      query
    );

    //Cancel Setup Intent
    if (updateInvoice.status === BookingStatus.LEFT) {
      if (invoice.isValidSetupIntent === true) {
        await cancelIntents(invoice, uniqueId);
      }
    }

    //Make a Charge
    if (
      updateInvoice.status === BookingStatus.NOSHOW &&
      updateInvoice.isCharge === true
    ) {
      if (!invoice.stripeSetupIntentId || !invoice.stripePaymentMethodId) {
        throw new ApiError({
          message: Exceptions.CUSTOM_ERROR,
          devMessage: "Card not saved",
          statusCode: StatusCode.BAD_REQUEST,
        });
      }

      if (invoice.totalPaidAmount > 0 || invoice.isValidSetupIntent === false) {
        throw new ApiError({
          message: Exceptions.CUSTOM_ERROR,
          devMessage: "Amount already charge",
          statusCode: StatusCode.BAD_REQUEST,
        });
      }

      invoice = await createPaymentIntents(invoice, sequelize, uniqueId);
    }

    //Update Invoice Status
    const updatedInvoice = (
      await outletInvoiceDbInterface.updateInvoiceStatus(
        invoice.id,
        updateInvoice,
        user.id
      )
    ).toJSON();

    //contentChanges in Invoice
    const contentChange = contentChanges(invoice.toJSON(), updatedInvoice);

    //CustomerLog
    let customerLogsPayload: CustomerLogs = {
      customerId: updatedInvoice.customerId,
      logType: CustomerLogType.ACTIVITY,
      action: Actions.UPDATED,
      moduleName: CustomerLogPageTitle.CUSTOMER_RESERVATION,
      contentChange,
      updatedBy: user.id,
      outletInvoiceId: updatedInvoice.id,
    };

    const customerLogsDbInterface = new CustomerLogsDbInterface(sequelize);
    await customerLogsDbInterface.create(customerLogsPayload);

    const response = {
      ...updatedInvoice,
      image: updatedInvoice.image
        ? JSON.parse(updatedInvoice.image)
        : updatedInvoice.image,
      dietaryRestriction: updatedInvoice.dietaryRestriction
        ? JSON.parse(updatedInvoice.dietaryRestriction)
        : [],
      basket: updatedInvoice.basket ? JSON.parse(updatedInvoice.basket) : [],
      dinningOptions: updatedInvoice.dinningOptions
        ? JSON.parse(updatedInvoice.dinningOptions)
        : [],
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
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Booking Updated Successfully",
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

export const updateStatusByMail = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const uniqueId = getGuid();
  const { sequelize, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      "updateStatusByMail",
      Actions.UPDATED,
      params,
      uniqueId
    );
    const { invoiceId, status } = params;

    const updateInvoice: UpdateInvoice = {
      status,
    };

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const invoice = await outletInvoiceDbInterface.getInvoiceById(invoiceId);
    Log.writeLog(
      Loglevel.INFO,
      "updateStatusByMail",
      Actions.CREATED,
      "Invoice Found",
      uniqueId
    );

    if (invoice.status !== BookingStatus.BOOKED) {
      return res.redirect(
        `${FrontEndBaseURL}/Invoice/${invoice.id}/Status/${BookingStatus.ERROR}`
      );
    }

    const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
      sequelize
    );

    let query = {
      status: status,
    };

    //Update OutletTable Booking Status
    await outletTableBookingDbInterface.UpdateStatusByInvoiceId(
      invoice.id,
      query
    );

    //Update Invoice Status
    const updatedInvoice = await outletInvoiceDbInterface.updateInvoiceStatus(
      invoice.id,
      updateInvoice,
      user.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      "updateStatusByMail",
      Actions.UPDATED,
      params,
      updatedInvoice,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    res.redirect(
      `${FrontEndBaseURL}/Invoice/${updatedInvoice.id}/Status/${updatedInvoice.status}`
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "updateStatusByMail",
      Actions.UPDATED,
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

//Charge Amount
export const chargeAmountFromInvoice = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "chargeAmountFromInvoice",
      params,
      uniqueId
    );

    const invoiceId = params.id;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "chargeAmountFromInvoice",
      "User Found",
      uniqueId
    );

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    let getInvoice = await outletInvoiceDbInterface.getInvoiceById(invoiceId);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "chargeAmountFromInvoice",
      "Invoice Found",
      uniqueId
    );

    if (!getInvoice.stripeSetupIntentId || !getInvoice.stripePaymentMethodId) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Card not saved",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    if (
      getInvoice.totalPaidAmount > 0 ||
      getInvoice.isValidSetupIntent === false
    ) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Amount already charge",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    getInvoice = await createPaymentIntents(getInvoice, sequelize, uniqueId);

    const response = {
      ...getInvoice.toJSON(),
      image: getInvoice.image ? JSON.parse(getInvoice.image) : getInvoice.image,
      dietaryRestriction: getInvoice.dietaryRestriction
        ? JSON.parse(getInvoice.dietaryRestriction)
        : [],
      basket: getInvoice.basket ? JSON.parse(getInvoice.basket) : [],
      dinningOptions: getInvoice.dinningOptions
        ? JSON.parse(getInvoice.dinningOptions)
        : [],
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "chargeAmountFromInvoice",
      params,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Amount Charge Successfully",
        data: response,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "chargeAmountFromInvoice",
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
