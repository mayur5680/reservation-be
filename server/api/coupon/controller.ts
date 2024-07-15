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
import { Coupon } from "../../db/interface";
import { GetCouponRequest, TimeSlotDetails } from "../../@types/coupon";
import {
  contentChanges,
  getAdminUser,
  getTradingHoursBydate,
  getUpdateBy,
} from "../shared";
import {
  UserDbInterface,
  OutletDbInterface,
  CouponDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { Op } from "sequelize";
import { ContentChangesPayload } from "../../@types/customer";

let moment = require("moment-timezone");

const moduleName = "TimingPromo";

export const createCoupon = async (
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

    const userId = decoded.userDetail.id;
    const outletId = params.outletId;

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

    const couponRequestPayload: Coupon = body;

    const startDate = new Date(
      moment(couponRequestPayload.startDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day")
    );

    const endDate = new Date(
      moment(couponRequestPayload.endDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day")
    );

    couponRequestPayload.startDate = startDate;
    couponRequestPayload.endDate = endDate;
    couponRequestPayload.outletId = outlet.id;

    couponRequestPayload.repeatOn = JSON.stringify(
      couponRequestPayload.repeatOn
    );

    const couponDbInterface = new CouponDbInterface(sequelize);

    const createCoupon = await couponDbInterface.create(
      couponRequestPayload,
      user.id
    );

    const getCoupon = await couponDbInterface.getRawCouponById(createCoupon.id);

    const response = {
      ...getCoupon,
      updatedBy: getUpdateBy(user),
      repeatOn: JSON.parse(getCoupon.repeatOn),
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
        message: "Coupon Created Successfully",
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

export const getAllCoupon = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, body, uniqueId);

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

    const getCouponRequest: GetCouponRequest = body;
    let NormalDateStartDateTime = null;
    let NormalDateEndDateTime = null;

    if (getCouponRequest.fromDate && getCouponRequest.toDate) {
      let startDayDateTime = moment(getCouponRequest.fromDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day");

      let endDayDateTime = moment(getCouponRequest.toDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day");
      NormalDateStartDateTime = new Date(startDayDateTime);
      NormalDateEndDateTime = new Date(endDayDateTime);
    } else {
      let startDayDateTime = moment().tz(outlet.timezone).startOf("day");
      let endDayDateTime = moment()
        .tz(outlet.timezone)
        .add(5, "days")
        .endOf("day");
      NormalDateStartDateTime = new Date(startDayDateTime);
      NormalDateEndDateTime = new Date(endDayDateTime);
    }

    let query: any = {
      outletId: outlet.id,
      [Op.and]: [
        {
          startDate: {
            [Op.gte]: NormalDateStartDateTime,
          },
        },
        {
          endDate: {
            [Op.lte]: NormalDateEndDateTime,
          },
        },
      ],
    };

    const couponDbInterface = new CouponDbInterface(sequelize);
    const getCoupons = (
      await couponDbInterface.getAllCouponByOutletId(query)
    ).map((coupon) => {
      return {
        ...coupon,
        repeatOn: JSON.parse(coupon.repeatOn),
      };
    });

    const checkOutlet = await outletDbInterface.getOutletsForTimeSlot(
      outlet.id
    );

    const startDate = moment(NormalDateStartDateTime).tz(outlet.timezone);
    const endDate = moment(NormalDateEndDateTime).tz(outlet.timezone);

    let date = startDate;

    let operationHours: any[] = [];

    while (date.isBefore(endDate)) {
      const dayofweek = date.format("dddd");

      const tradingHours = getTradingHoursBydate(checkOutlet, date, dayofweek);

      tradingHours.map((tradinghour) => {
        tradinghour.timePeriods.map((single) => {
          operationHours.push(single);
        });
      });

      date = moment(date).tz(outlet.timezone).add(1, "days");
    }

    let timeSlotDetails: TimeSlotDetails = {
      timeSlotInterval: outlet.timeSlotInterval,
    };

    if (operationHours.length > 0) {
      let openingTime = operationHours[0].openingTime;
      let closingTime = operationHours[0].closingTime;

      operationHours.map((operationHour) => {
        if (openingTime > operationHour.openingTime) {
          openingTime = operationHour.openingTime;
        }
        if (closingTime < operationHour.closingTime) {
          closingTime = operationHour.closingTime;
        }
      });

      timeSlotDetails = {
        openingTime: openingTime,
        closingTime: closingTime,
        timeSlotInterval: outlet.timeSlotInterval,
      };
    }

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      body,
      getCoupons,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: { coupons: getCoupons, timeSlotDetails },
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

export const updateCoupon = async (
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

    const userId = decoded.userDetail.id;
    const { couponId, outletId } = params;

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

    const couponDbInterface = new CouponDbInterface(sequelize);
    const coupon = await couponDbInterface.getRawCouponById(couponId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Coupon Found",
      uniqueId
    );

    const couponRequestPayload: Coupon = body;
    const startDate = new Date(
      moment(couponRequestPayload.startDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day")
    );

    const endDate = new Date(
      moment(couponRequestPayload.endDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day")
    );

    couponRequestPayload.startDate = startDate;
    couponRequestPayload.endDate = endDate;
    couponRequestPayload.outletId = outlet.id;

    couponRequestPayload.repeatOn = JSON.stringify(
      couponRequestPayload.repeatOn
    );

    let response;

    let contentChange;

    if (couponRequestPayload.isCampaignActive === true) {
      const updatedCoupon = await couponDbInterface.updateCoupon(
        coupon.id,
        couponRequestPayload,
        user.id
      );

      response = {
        ...updatedCoupon,
        repeatOn: JSON.parse(updatedCoupon.repeatOn),
      };

      contentChange = contentChanges(coupon, updatedCoupon);
    } else {
      const deletedCoupon = await couponDbInterface.deleteCoupon(
        coupon.id,
        user.id
      );
      response = deletedCoupon.id;
    }

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
        message: "Coupon Updated Successfully",
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
