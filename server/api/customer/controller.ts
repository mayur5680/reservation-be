import { Response, NextFunction } from "express";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Loglevel,
  Actions,
  LogTypes,
  CustomerLogType,
  CustomerLogPageTitle,
  CustomerReservation,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { FilterCustomerReservation } from "../../@types/customer";
import { getGuid } from "../../context/service";
import { Customer, CustomerLogs, OutletInvoice } from "../../db/interface";
import {
  OutletDbInterface,
  CustomerDbInterface,
  UserDbInterface,
  CustomerLogsDbInterface,
  CompanyDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import {
  customerChurnRisk,
  customerContentChanges,
  getAdminUser,
  getUserOutlets,
} from "../shared";
import { Op } from "sequelize";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
let moment = require("moment-timezone");

const moduleName = "CustomerManagemnt";

export const getAllCustomers = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, body, uniqueId);

    const userId = decoded.userDetail.id;

    const filterReservation: FilterCustomerReservation = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "User Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const companies = await companyDbInterface.getAllcompanyByIds(
      filterReservation.companyIds
    );

    if (companies.length !== filterReservation.companyIds.length) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Invalid Brand",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Companies Found",
      uniqueId
    );

    let customerQuery: any = null;

    if (!user.roleId) {
      const getUserOutlet = await getUserOutlets(user.id, sequelize);
      customerQuery = {
        companyId: {
          [Op.in]: filterReservation.companyIds,
        },
        id: {
          [Op.in]: getUserOutlet,
        },
      };
    } else {
      customerQuery = {
        companyId: {
          [Op.in]: filterReservation.companyIds,
        },
      };
    }

    const customerDbInterface = new CustomerDbInterface(sequelize);

    let query: any = null;

    let NormalDateStartDateTime = null;

    if (filterReservation.filter === CustomerReservation.UPCOMING) {
      let startDayDateTime = moment().tz("Asia/Singapore");
      NormalDateStartDateTime = new Date(startDayDateTime);

      query = {
        [Op.and]: [
          {
            bookingStartTime: {
              [Op.gte]: NormalDateStartDateTime,
            },
          },
        ],
      };
    }

    const getCustomers = await customerDbInterface.getAllCustomersByCompanyId(
      customerQuery,
      query
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      body,
      getCustomers,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getCustomers,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
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

export const getCustomersReservation = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, body, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetCustomerReservation",
      { params, body },
      uniqueId
    );

    const { customerId, outletId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetCustomerReservation",
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetCustomerReservation",
      "Outlet Found",
      uniqueId
    );

    const filterReservation: FilterCustomerReservation = body;

    const customerDbInterface = new CustomerDbInterface(sequelize);
    const customer = await customerDbInterface.getCustomerbyId(customerId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetCustomerReservation",
      "Customer Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    if (customer.outletId !== outlet.id) {
      throw new ApiError({
        message: Exceptions.INVALID_CUSTOMER,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    let query: any = {};

    let NormalDateEndDateTime = null;

    if (filterReservation.filter === CustomerReservation.UPCOMING) {
      NormalDateEndDateTime = new Date(moment().tz(outlet.timezone));

      query = {
        [Op.and]: [
          {
            bookingStartTime: {
              [Op.gte]: NormalDateEndDateTime,
            },
          },
        ],
      };
    }

    if (filterReservation.filter === CustomerReservation.PAST) {
      NormalDateEndDateTime = new Date(moment().tz(outlet.timezone));

      query = {
        [Op.and]: [
          {
            bookingStartTime: {
              [Op.lte]: NormalDateEndDateTime,
            },
          },
        ],
      };
    }

    let Customer = (
      await customerDbInterface.getFilterCustomerReservation(customer.id, query)
    )?.toJSON();

    if (Customer && Customer.OutletInvoice.length > 0) {
      const OutletInvoice = Customer.OutletInvoice.map(
        (invoice: OutletInvoice) => {
          return {
            ...invoice,
            dietaryRestriction: invoice.dietaryRestriction
              ? JSON.parse(invoice.dietaryRestriction)
              : [],
            basket: invoice.basket ? JSON.parse(invoice.basket) : [],
            dinningOptions: invoice.dinningOptions
              ? JSON.parse(invoice.dinningOptions)
              : [],
          };
        }
      );

      Customer.OutletInvoice = OutletInvoice;
    }

    if (Customer && Customer.CustomerLogs.length > 0) {
      const customerLogs = Customer.CustomerLogs.map((log: CustomerLogs) => {
        if (log.contentChange) {
          return {
            ...log,
            contentChange: JSON.parse(log.contentChange),
          };
        }
        return log;
      });

      Customer.CustomerLogs = customerLogs;
    }

    const ChurnRisk = await customerChurnRisk(customer.id, sequelize);

    let response;

    if (Customer) {
      response = {
        Customer: {
          ...Customer,
          tags: JSON.parse(Customer.tags),
        },
        ChurnRisk,
      };
    } else {
      response = {
        Customer: {},
        ChurnRisk,
      };
    }

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "GetCustomerReservation",
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
      "GetCustomerReservation",
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

export const getCustomerProfile = async (
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
      "GetCustomerProfile",
      params,
      uniqueId
    );

    const { customerId, outletId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetCustomerProfile",
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetCustomerProfile",
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const customerDbInterface = new CustomerDbInterface(sequelize);

    const Customer = (
      await customerDbInterface.getCustomerbyId(customerId)
    ).toJSON();

    if (Customer.outletId !== outlet.id) {
      throw new ApiError({
        message: Exceptions.INVALID_CUSTOMER,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const ChurnRisk = await customerChurnRisk(customerId, sequelize);

    const response = {
      Customer: {
        ...Customer,
        tags: JSON.parse(Customer.tags),
      },
      ChurnRisk,
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "GetCustomerProfile",
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
      "GetCustomerProfile",
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

export const updateCustomer = async (
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

    const { customerId, outletId } = params;

    const userId = decoded.userDetail.id;

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

    const customerDbInterface = new CustomerDbInterface(sequelize);
    const customer = await customerDbInterface.getCustomerbyId(customerId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Customer Found",
      uniqueId
    );

    const customerpPayload: Customer = body;

    customerpPayload.tags = JSON.stringify(customerpPayload.tags);

    if (customerpPayload.dob) {
      const dob = new Date(
        moment(customerpPayload.dob, "DD-MM-YYYY").startOf("day")
      );

      customerpPayload.dob = dob;
    }

    const updateCustomer = (
      await customerDbInterface.updateCustomer(
        customer.id,
        user.id,
        customerpPayload
      )
    ).toJSON();

    const contentChange = customerContentChanges(customer, updateCustomer);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updateCustomer,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    //CustomerLog
    let customerLogsPayload: CustomerLogs = {
      customerId: customer.id,
      logType: CustomerLogType.ACTIVITY,
      action: Actions.UPDATED,
      moduleName: CustomerLogPageTitle.CUSTOMER_PROFILE,
      contentChange,
      updatedBy: user.id,
    };

    const customerLogsDbInterface = new CustomerLogsDbInterface(sequelize);
    await customerLogsDbInterface.create(customerLogsPayload);

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Customer Updated Successfully",
        data: {
          ...updateCustomer,
          tags: JSON.parse(updateCustomer.tags),
        },
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
