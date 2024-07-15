import { CouponDbInterface } from "../../db-interfaces";
import { Op, Sequelize } from "sequelize";
import { CouponDbModel, OutletDbModel } from "server/db/models";
import { Moment } from "moment";
import {
  BookTablePayload,
  DiscountTimeSlot,
  FutureTradingHours,
  OutletInfoRequest,
} from "../../@types/customerBooking";
import { Loglevel, Actions } from "../../context";
import { Log } from "../../context/Logs";
let moment = require("moment-timezone");

export const getCoupon = async (
  bookTablePayload: BookTablePayload,
  outlet: OutletDbModel,
  sequelize: Sequelize
): Promise<CouponDbModel | null> => {
  const noOfPerson =
    Number(bookTablePayload.noOfAdult) + Number(bookTablePayload.noOfChild);

  const bookingDate = moment(bookTablePayload.date, "DD-MM-YYYY")
    .tz(outlet.timezone)
    .startOf("day");

  const weekName = bookingDate.format("dddd");

  let query: any = {
    outletId: outlet.id,
    [Op.and]: [
      {
        startDate: {
          [Op.lte]: new Date(bookingDate),
        },
      },
      {
        endDate: {
          [Op.gte]: new Date(bookingDate),
        },
      },
      {
        openingTime: {
          [Op.lte]: bookTablePayload.exactTime,
        },
      },
      {
        closingTime: {
          [Op.gte]: bookTablePayload.exactTime,
        },
      },
    ],
    noOfPerson: {
      [Op.lte]: noOfPerson,
    },
    repeatOn: {
      [Op.like]: `%${weekName}%`,
    },
  };

  const couponDbInterface = new CouponDbInterface(sequelize);
  const coupon = await couponDbInterface.getCouponForBooking(query);

  return coupon;
};

export const getTimeSlotCoupon = async (
  tradingHours: FutureTradingHours[],
  outletInfoRequest: OutletInfoRequest,
  outlet: OutletDbModel,
  sequelize: Sequelize,
  uniqueId: string
): Promise<DiscountTimeSlot[]> => {
  const noOfPerson =
    Number(outletInfoRequest.noOfAdult) + Number(outletInfoRequest.noOfChild);

  const bookingDate = moment(outletInfoRequest.date, "DD-MM-YYYY")
    .tz(outlet.timezone)
    .startOf("day");
  const weekName = bookingDate.format("dddd");

  let query: any = {
    outletId: outlet.id,
    [Op.and]: [
      {
        startDate: {
          [Op.lte]: new Date(bookingDate),
        },
      },
      {
        endDate: {
          [Op.gte]: new Date(bookingDate),
        },
      },
    ],
    noOfPerson: {
      [Op.lte]: noOfPerson,
    },
    repeatOn: {
      [Op.like]: `%${weekName}%`,
    },
  };

  const couponDbInterface = new CouponDbInterface(sequelize);
  const coupons = await couponDbInterface.getCouponForTimeSlot(query);
  Log.writeLog(
    Loglevel.INFO,
    "Get TimeSlot Coupon",
    Actions.GET,
    "Coupon Found",
    uniqueId
  );

  let timeSlots: string[] = [];

  if (tradingHours.length > 0) {
    timeSlots = tradingHours[0].timeSlots as string[];
  }

  const discountTimeSlot: DiscountTimeSlot[] = [];

  if (timeSlots && timeSlots.length > 0 && coupons.length > 0) {
    timeSlots.map((timeslot) => {
      const coupon = coupons.filter((coupon) => {
        if (coupon.openingTime <= timeslot && coupon.closingTime >= timeslot) {
          return coupon;
        }
        return null;
      });

      if (coupon.length > 0) {
        discountTimeSlot.push({
          timeSlot: timeslot,
          coupon: coupon,
        });
      }
    });
  }

  return discountTimeSlot;
};
