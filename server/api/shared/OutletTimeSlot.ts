import { Actions, Loglevel } from "../../context";
import { getGuid } from "../../context/service";
import { TradingHours, TimePeriod } from "../../@types/customerBooking";
import { Day } from "../../context";
import { OutletDbModel, OutletTimeSlotDbModel } from "server/db/models";
import { Log } from "../../context/Logs";
import { OutletTimeSlot } from "../../db/interface";
import { Moment } from "moment";

let moment = require("moment-timezone");

const moduleName = "Reservation";

/**
 * returns formatted trading hours and filtered store Section Timeslots with overlapping, breaks etc.
 * @param rawStoreDbModel raw storeDbModel
 */

export const getFormattedTradingHoursAndTimeslots = (
  rawStoreDbModel: OutletDbModel,
  date: undefined | Moment = undefined
): TradingHours[] => {
  const tradingHours: TradingHours[] = [];
  const filteredSectionTimeslots: OutletTimeSlotDbModel[] = [];

  const storeTimeZone = rawStoreDbModel.timezone;

  const formattedTimeZone = date ? moment(date) : moment.tz(storeTimeZone);

  // filter and order raw db model according to conditionals defined
  const sectionTimeSlots = filterAndSortRawDbModel(rawStoreDbModel);

  // calculate and return tradingHours, filteredSectionTimeslots, storeTimeZone
  // in case there is no related storeTimeZone, return empty array
  if (sectionTimeSlots?.length > 0 && storeTimeZone) {
    // formatting the timeZone for processing

    const operatingHoursByDay: {
      [key: number]: OutletTimeSlotDbModel[] | undefined;
    } = {};

    sectionTimeSlots.forEach((sectionTimeslot: OutletTimeSlotDbModel) => {
      const { dayofweek } = sectionTimeslot;

      const storeHours = operatingHoursByDay[dayofweek] ?? [];
      storeHours.push(sectionTimeslot);
      operatingHoursByDay[dayofweek] = storeHours;
    });

    const weekDays = Object.values(Day);
    let dayofweek = formattedTimeZone.day();
    let formattedTimeZoneDate = formattedTimeZone;

    while (tradingHours.length < 7) {
      const operatingHours = operatingHoursByDay[dayofweek];

      const timePeriods: TimePeriod[] = [];
      let filteredStoreHours: OutletTimeSlotDbModel[] = [];

      // Create an opening hours string based on potentially multiple operating hours
      if (operatingHours && operatingHours.length > 0) {
        filteredStoreHours = flattenStoreHours(operatingHours);

        filteredStoreHours.map(({ openingTime, closingTime }) => {
          timePeriods.push({
            openingTime: formatTime(openingTime),
            closingTime: formatTime(closingTime),
          });
        });
      }

      // Create the trading/operating hours in the required response format
      const tradingHoursResponseItem: TradingHours = {
        dayofweek: weekDays[dayofweek],
        timePeriods,
        date: formattedTimeZoneDate.format("YYYY-MM-DD"),
      };

      tradingHours.push(tradingHoursResponseItem);
      filteredSectionTimeslots.push(...filteredStoreHours);

      // Increment the day for the loop and reset back to the first day of the week i.e. 0
      // if we're over the 7th day
      dayofweek++;
      if (dayofweek > 6) dayofweek = 0;

      formattedTimeZoneDate = formattedTimeZoneDate.add(1, "days");
    }
  }
  return tradingHours;
};

/**
 * filters provided rawDbModel with the attributes check and orders it accordingly
 * @param storeDbModel rawStoreDbModel with unordered and unfiltered data
 */
export const filterAndSortRawDbModel = (
  outletDbModel: OutletDbModel
): OutletTimeSlotDbModel[] => {
  const uniqueId = getGuid();
  const filteredTimeSlots: OutletTimeSlotDbModel[] = [];
  const overriddenSectionTimeSlots: OutletTimeSlotDbModel[] = [];
  const sectionTimeSlots = outletDbModel.OutletTimeSlot;
  const override = outletDbModel.OutletTimeSlotOverride;
  let newOutletSectionTimeSlots: OutletTimeSlotDbModel[] = [];
  // validate sectionTimeSlots
  if (sectionTimeSlots && sectionTimeSlots.length > 0) {
    // filtering the raw timeslots received from dbModel based on isActive, openingTime and closingTime
    // if any of them is not available then log error with storeId and dayOfWeek info

    for (const timeSlot of sectionTimeSlots) {
      if (!timeSlot.isActive) {
        continue;
      }
      if (!timeSlot.openingTime) {
        Log.writeLog(
          Loglevel.ERROR,
          moduleName,
          Actions.GET,
          `OpeningTimes is null or not defined for outlet,  Outletid: ${timeSlot.outletId} and dayOfWeek ${timeSlot.dayofweek}`,
          uniqueId
        );
        continue;
      }
      if (!timeSlot.closingTime) {
        Log.writeLog(
          Loglevel.ERROR,
          moduleName,
          Actions.GET,
          `ClosingTime is null or not defined, Outletid: ${timeSlot.outletId} and dayOfWeek ${timeSlot.dayofweek}`,
          uniqueId
        );
        continue;
      }

      //if timeSlot exists or falls within the effectiveFrom/To we will skip it
      if (override && override.length > 0) {
        const storeSectionTimeSlotOverrides = override;

        const sectionTimeSlotWithOverrides =
          storeSectionTimeSlotOverrides.filter((timeSlotOverride) => {
            return (
              timeSlotOverride.sectionId === timeSlot.sectionId &&
              timeSlotOverride.dayofweek === timeSlot.dayofweek
            );
          });

        if (sectionTimeSlotWithOverrides.length > 0) {
          for (const sectionTimeSlotOverride of sectionTimeSlotWithOverrides) {
            // if a section will have more than  1 trading hours
            // e.g. from 7AM-10:30 to 7:30AM-9AM OPEN, 9AM-10AM CLOSE, 10AM-11AM OPEN
            // if timeSlot are overridden we will set the updated opening and closing time for a particular section.
            if (sectionTimeSlotOverride.outletStatus === true) {
              const sectionTimeSlotOverrideObject: OutletTimeSlot = {
                outletId: timeSlot.outletId,
                sectionId: timeSlot.sectionId,
                dayofweek: timeSlot.dayofweek,
                openingTime: sectionTimeSlotOverride.openingTime,
                closingTime: sectionTimeSlotOverride.closingTime,
                Section: sectionTimeSlotOverride.Section,
                isActive: true,
              };
              overriddenSectionTimeSlots.push(
                sectionTimeSlotOverrideObject as OutletTimeSlotDbModel
              );
            }
          }
          continue;
        }
      }
      filteredTimeSlots.push(timeSlot);
    }

    const finalSectionTimeSlots =
      overriddenSectionTimeSlots.length > 0
        ? filteredTimeSlots.concat(overriddenSectionTimeSlots)
        : filteredTimeSlots;

    // sort and assign filteredTimeslots by dayOfWeek and openingTime attributes
    // equivalent to orderBy dayOfWeek,ASC and openingTime ASC
    // (opening time converted to moment first as openingTime is string in dbModel)
    newOutletSectionTimeSlots = finalSectionTimeSlots.sort(
      (firstItem, nextItem) =>
        firstItem.dayofweek - nextItem.dayofweek ||
        moment(firstItem.openingTime, "HH:mm").diff(
          moment(nextItem.openingTime, "HH:mm")
        )
    );
  }

  return newOutletSectionTimeSlots;
};

/**
 * returns flattened store storeTimeslots from provided raw storeTimeslots that may contain overlaps, breaks
 * @param storeSectionTimeSlots raw input storeSectionTimeSlots
 */
export const flattenStoreHours = (
  storeSectionTimeSlots: OutletTimeSlotDbModel[]
): OutletTimeSlotDbModel[] => {
  const filteredStoreOperatingHours: OutletTimeSlotDbModel[] = [];

  let selectedStoreOperatingHour: OutletTimeSlotDbModel =
    storeSectionTimeSlots[0];

  storeSectionTimeSlots.map((timeslot, index) => {
    if (index != 0) {
      const selectedStoreOpeningTime = moment(
        selectedStoreOperatingHour.openingTime,
        "HH:mm"
      );
      const selectedStoreClosingTime = moment(
        selectedStoreOperatingHour.closingTime,
        "HH:mm"
      );

      const nextStoreOpeningTime = moment(timeslot.openingTime, "HH:mm");
      const nextStoreClosingTime = moment(timeslot.closingTime, "HH:mm");

      if (
        nextStoreOpeningTime.isBetween(
          selectedStoreOpeningTime,
          selectedStoreClosingTime
        ) ||
        nextStoreOpeningTime.isSame(selectedStoreClosingTime) ||
        nextStoreOpeningTime.isBefore(selectedStoreClosingTime)
      ) {
        if (nextStoreClosingTime.isAfter(selectedStoreClosingTime)) {
          selectedStoreOperatingHour.closingTime = timeslot.closingTime;
        }
      } else {
        filteredStoreOperatingHours.push(selectedStoreOperatingHour);
        selectedStoreOperatingHour = timeslot;
      }
    }
  });
  filteredStoreOperatingHours.push(selectedStoreOperatingHour);

  return filteredStoreOperatingHours;
};

export const formatTime = (unFormattedTime: string): string => {
  const currentTime = moment();

  const [h, m] = unFormattedTime.split(":");

  currentTime.set({ h: parseInt(h), m: parseInt(m) });
  return currentTime.format("HH:mm");
};

export const timeSlot = (outlet: OutletDbModel, date: Date) => {
  const outletTimeSlot = outlet.OutletTimeSlot;
  const dayofweek = moment().day(date).weekday();
  let filteredTimeSlots: OutletTimeSlotDbModel[] = [];
  let newOutletSectionTimeSlots: OutletTimeSlotDbModel[] = [];

  if (outletTimeSlot) {
    filteredTimeSlots = outletTimeSlot.filter(
      (timeSlot) => timeSlot.dayofweek === dayofweek
    );
  }

  const finalSectionTimeSlots = filteredTimeSlots;

  newOutletSectionTimeSlots = finalSectionTimeSlots.sort(
    (firstItem, nextItem) =>
      firstItem.dayofweek - nextItem.dayofweek ||
      moment(firstItem.openingTime, "HH:mm").diff(
        moment(nextItem.openingTime, "HH:mm")
      )
  );

  const operatingHoursByDay: {
    [key: number]: OutletTimeSlotDbModel[] | undefined;
  } = {};
  newOutletSectionTimeSlots.forEach(
    (sectionTimeslot: OutletTimeSlotDbModel) => {
      const { dayofweek } = sectionTimeslot;

      const storeHours = operatingHoursByDay[dayofweek] ?? [];
      storeHours.push(sectionTimeslot);
      operatingHoursByDay[dayofweek] = storeHours;
    }
  );

  const operatingHours = operatingHoursByDay[dayofweek];

  const timePeriods: TimePeriod[] = [];
  let filteredStoreHours: OutletTimeSlotDbModel[] = [];

  // Create an opening hours string based on potentially multiple operating hours
  if (operatingHours && operatingHours.length > 0) {
    filteredStoreHours = flattenStoreHours(operatingHours);

    filteredStoreHours.map(({ openingTime, closingTime }) => {
      timePeriods.push({
        openingTime: formatTime(openingTime),
        closingTime: formatTime(closingTime),
      });
    });
  }
};
