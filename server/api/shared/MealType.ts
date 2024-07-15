import { StatusCode } from "../../context";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { OutletDbInterface } from "../../db-interfaces";
import { filterAndSortRawDbModel } from "../shared";
import {
  OutletTimeSlotOverrideDbModel,
  SectionDbModel,
} from "server/db/models";
import { Sequelize } from "sequelize";
import { Moment } from "moment";
import { Loglevel, Actions } from "../../context";
import { Log } from "../../context/Logs";
const moduleName = "MealType";

export const getMealType = async (
  requestDate: Moment,
  exactTime: string,
  outletId: number,
  sequelize: Sequelize,
  uniqueId: string
): Promise<SectionDbModel | null> => {
  const dayofweek = requestDate.day();

  const outletDbInterface = new OutletDbInterface(sequelize);

  const outlet = await outletDbInterface.getOutletByIdForMealType(
    outletId,
    dayofweek
  );
  Log.writeLog(
    Loglevel.INFO,
    moduleName,
    Actions.GET,
    "Outlet TimeSlot Found",
    uniqueId
  );

  //check override timeSlots Data
  const timeSlotOverrides: OutletTimeSlotOverrideDbModel[] = [];

  if (!outlet) return null;
  outlet.OutletTimeSlotOverride?.map((timeSlotOverride) => {
    if (
      requestDate.isBetween(
        timeSlotOverride.effectiveFrom,
        timeSlotOverride.effectiveTo
      )
    )
      timeSlotOverrides.push(timeSlotOverride);
  });
  outlet.OutletTimeSlotOverride = timeSlotOverrides;

  const getAllTimeSlot = filterAndSortRawDbModel(outlet);
  Log.writeLog(
    Loglevel.INFO,
    moduleName,
    Actions.GET,
    "Outlet Trading Hours Found",
    uniqueId
  );

  const section = getAllTimeSlot.find((timeSlot) => {
    if (timeSlot.openingTime <= exactTime && timeSlot.closingTime > exactTime) {
      return timeSlot;
    }
    return null;
  });

  if (section?.Section) {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "MealType Found",
      uniqueId
    );

    return section.Section;
  } else {
    Log.writeLog(
      Loglevel.WARN,
      moduleName,
      Actions.GET,
      "MealType Not Found",
      uniqueId
    );
    return null;
  }
};
