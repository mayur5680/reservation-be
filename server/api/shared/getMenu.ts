import { SectionDbInterface } from "../../db-interfaces";
import { convertMinutes, filterAndSortRawDbModel } from "../shared";
import {
  OutletDbModel,
  OutletTimeSlotOverrideDbModel,
  PreOrderItemDbModel,
  SectionDbModel,
} from "../../db/models";
import { Op, Sequelize } from "sequelize";
import { Log } from "../../context/Logs";
import { Loglevel } from "../../context";
import { BasketItem } from "../../@types/customerBooking";
let moment = require("moment-timezone");

export const getMenuInStep4 = async (
  requestDate: any,
  outlet: OutletDbModel,
  getInvoices: any[],
  startDateTime: any,
  currentOutletTime: any,
  uniqueId: string,
  sequelize: Sequelize
): Promise<SectionDbModel[]> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "getMenuInStep4",
      "requestDate",
      requestDate,
      uniqueId
    );
    const weekday = requestDate.day();

    const weekName = requestDate.format("dddd");

    const sectionDbInterface = new SectionDbInterface(sequelize);

    const timeSlotOverrides: OutletTimeSlotOverrideDbModel[] = [];

    outlet.OutletTimeSlotOverride?.map(
      (timeSlotOverride: OutletTimeSlotOverrideDbModel) => {
        const startTime = moment(timeSlotOverride.effectiveFrom)
          .tz(outlet.timezone)
          .startOf("day");

        const endTime = moment(timeSlotOverride.effectiveTo)
          .tz(outlet.timezone)
          .endOf("day");

        if (requestDate.isBetween(startTime, endTime, undefined, "[]"))
          timeSlotOverrides.push(timeSlotOverride);
      }
    );
    outlet.OutletTimeSlotOverride = timeSlotOverrides;

    const getAllTimeSlot = filterAndSortRawDbModel(outlet);

    const temp = getAllTimeSlot.filter((single) => {
      return single.dayofweek === weekday;
    });

    let seationIds = temp.map((timeslot) => {
      return timeslot.sectionId;
    });

    let query: any = {
      outletId: outlet.id,
      [Op.and]: [
        {
          startDate: {
            [Op.lte]: new Date(requestDate),
          },
        },
        {
          endDate: {
            [Op.gte]: new Date(requestDate),
          },
        },
      ],
      repeatOn: {
        [Op.like]: `%${weekName}%`,
      },
      isActive: true,
    };

    Log.writeLog(
      Loglevel.INFO,
      "getMenuInStep4",
      "getAllTimeSlot",
      getAllTimeSlot,
      uniqueId
    );

    const sections = await sectionDbInterface.getSectionForMeal(
      seationIds,
      query
    );

    const result = await Promise.all(
      sections.map(async (section) => {
        const sectionTimeSlot = temp.filter(
          (timeslot) => timeslot.sectionId === section.id
        );

        let PreOrderItemDbModel: any = [];

        if (
          section.PreOrderItemDbModel &&
          section.PreOrderItemDbModel.length > 0
        ) {
          PreOrderItemDbModel = await Promise.all(
            section.PreOrderItemDbModel.map(async (preOrderItem) => {
              const count = await dayMaxQtyPreOrderItem(
                preOrderItem,
                getInvoices,
                uniqueId
              );

              const dailyTotalQtyleft =
                Number(preOrderItem.dailyMaxQty) - Number(count);

              let isEnable = true;
              let message = "";

              const leadTime = moment(currentOutletTime).add(
                preOrderItem.leadTime,
                "minutes"
              );

              const checkLeapTime = startDateTime.isBefore(leadTime);

              if (checkLeapTime) {
                isEnable = false;
                const diff = leadTime.diff(startDateTime, "minutes");
                message = convertMinutes(preOrderItem.leadTime);
              }

              return {
                ...preOrderItem.toJSON(),
                dailyTotalQtyleft,
                isEnable,
                message,
              };
            })
          );
        }

        return {
          ...section.toJSON(),
          PreOrderItemDbModel,
          tradingHours: sectionTimeSlot.map((timeslot) => {
            return {
              openingTime: timeslot.openingTime,
              closingTime: timeslot.closingTime,
            };
          }),
        };
      })
    );

    Log.writeLog(Loglevel.INFO, "getMenuInStep4", "result", result, uniqueId);

    return result;
  } catch (error) {
    Log.writeLog(Loglevel.ERROR, "getMenuInStep4", "error", error, uniqueId);

    throw error;
  }
};

export const dayMaxQtyPreOrderItem = async (
  preOrderItem: PreOrderItemDbModel,
  getInvoices: any[],
  uniqueId: string
): Promise<Number> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "dayMaxQtyPreOrderItem",
      "preOrderItem",
      preOrderItem,
      uniqueId
    );

    let countTotalQty = 0;

    await Promise.all(
      getInvoices.map((invoice) => {
        if (invoice.basket && invoice.basket.length > 0) {
          invoice.basket.map((data: BasketItem) => {
            if (data.itemId === preOrderItem.id) {
              countTotalQty += data.qty;
            }
          });
        }
      })
    );

    Log.writeLog(
      Loglevel.INFO,
      "dayMaxQtyPreOrderItem",
      "countTotalQty",
      countTotalQty,
      uniqueId
    );

    return countTotalQty;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "dayMaxQtyPreOrderItem",
      "error",
      error,
      uniqueId
    );
    throw error;
  }
};
