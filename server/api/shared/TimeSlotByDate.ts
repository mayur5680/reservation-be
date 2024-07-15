import * as lodash from "lodash";
import { Sequelize } from "sequelize";
import {
  GroupPossibilityDbInterface,
  OutletTableDbInterface,
  TicketingDbInterface,
} from "../../db-interfaces";
import {
  getFormattedTradingHoursAndTimeslots,
  getOutletDateTime,
} from "../shared";
import {
  GroupPossibilityDbModel,
  OutletDbModel,
  OutletTableDbModel,
  OutletTimeSlotOverrideDbModel,
} from "../../db/models";
import {
  FutureTradingHours,
  TimeSlotRequest,
  TradingHours,
} from "../../@types/customerBooking";
import { Loglevel, Actions } from "../../context";
import { Log } from "../../context/Logs";
let moment = require("moment-timezone");

const moduleName = "GetTimeSlotBydate";

export const getTradingHoursBydate = (
  outlet: OutletDbModel,
  outletStartDay: any,
  dayofweek?: string
): TradingHours[] => {
  const timeSlotOverrides: OutletTimeSlotOverrideDbModel[] = [];
  outlet.OutletTimeSlotOverride?.map((timeSlotOverride) => {
    const startTime = moment(timeSlotOverride.effectiveFrom)
      .tz(outlet.timezone)
      .startOf("day");

    const endTime = moment(timeSlotOverride.effectiveTo)
      .tz(outlet.timezone)
      .endOf("day");

    if (outletStartDay.isBetween(startTime, endTime, undefined, "[]"))
      timeSlotOverrides.push(timeSlotOverride);
  });
  outlet.OutletTimeSlotOverride = timeSlotOverrides;

  const tradingHours: TradingHours[] = getFormattedTradingHoursAndTimeslots(
    outlet,
    outletStartDay
  );
  if (dayofweek) {
    return tradingHours.filter(
      (tradingHour) => tradingHour.dayofweek === dayofweek
    );
  }

  return tradingHours;
};

export const getValidTimeSlot = async (
  timeSlotRequest: TimeSlotRequest,
  requestStartDate: any,
  requestEndDate: any,
  outlet: OutletDbModel,
  AllTradingHours: TradingHours[],
  dayofweek: string,
  currentOutletTime: any,
  sequelize: Sequelize,
  uniqueId: string,
  isCheckTableAvailibility = false
): Promise<string[]> => {
  //Filter Request Date Tradinghours
  try {
    const noOfPerson = timeSlotRequest.noOfAdult + timeSlotRequest.noOfChild;

    const tradingHours: TradingHours[] = AllTradingHours.filter(
      (week) => week.dayofweek === dayofweek
    );

    const timeSlots: string[] = [];
    tradingHours.map((singleTime) => {
      singleTime.timePeriods.map((timeslot) => {
        const outletStartTime = getOutletDateTime(
          outlet.timezone,
          timeslot.openingTime
        );
        const outletCloseTime = getOutletDateTime(
          outlet.timezone,
          timeslot.closingTime
        );
        const startTime = moment(outletStartTime, "HH:mm");
        const endTime = moment(outletCloseTime, "HH:mm");
        let time = startTime;

        while (time.isBefore(endTime)) {
          if (requestStartDate.isSame(moment().tz(outlet.timezone), "day")) {
            if (time.isSameOrAfter(currentOutletTime)) {
              timeSlots.push(time.format("HH:mm"));
            }
          } else {
            timeSlots.push(time.format("HH:mm"));
          }
          time = moment(time, "HH:mm").add(outlet.timeSlotInterval, "minutes");
        }
      });
    });

    const ticketingDbInterface = new TicketingDbInterface(sequelize);
    let tickets = await ticketingDbInterface.getAllTicketForTimeSlot(outlet.id);

    if (tickets && tickets.length > 0) {
      tickets = tickets.filter((ticket) => {
        const ticketStartTime = moment(ticket.startDate)
          .tz(outlet.timezone)
          .startOf("day");

        const ticketEndTime = moment(ticket.endDate)
          .tz(outlet.timezone)
          .endOf("day");

        if (
          requestStartDate.isBetween(
            ticketStartTime,
            ticketEndTime,
            undefined,
            "[]"
          ) ||
          requestEndDate.isBetween(
            ticketStartTime,
            ticketEndTime,
            undefined,
            "[]"
          )
        ) {
          return ticket;
        }
        return null;
      });
    }

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    let outletTables: OutletTableDbModel[] = [];
    let findValidGroupPossibitilyTable: GroupPossibilityDbModel[] | null;

    const checkCapacity = await outletTableDbInterface.checkTableAvaibility(
      noOfPerson,
      outlet.id
    );

    if (!checkCapacity) {
      const groupPossibilityDbInterface = new GroupPossibilityDbInterface(
        sequelize
      );
      findValidGroupPossibitilyTable =
        await groupPossibilityDbInterface.checkPossibilityTableForTimeSlot(
          outlet.id,
          requestStartDate,
          requestEndDate,
          noOfPerson
        );
    } else {
      outletTables = await outletTableDbInterface.getAllTables(
        requestStartDate,
        requestEndDate,
        outlet.id,
        noOfPerson
      );

      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        "OutletTables Found",
        outletTables,
        uniqueId
      );
    }

    let finalTimeSlots = timeSlots.map((timeSlot) => {
      let startDateTime = getOutletDateTime(
        outlet.timezone,
        timeSlot,
        timeSlotRequest.date
      );

      let endDateTime = moment(startDateTime)
        .add(outlet.timeSlotInterval, "minutes")
        .subtract(1, "minutes");

      let bookedTable: OutletTableDbModel[] = [];

      if (outletTables && outletTables.length > 0) {
        bookedTable = outletTables.filter((table) => {
          if (table.OutletTableBooking && table.OutletTableBooking.length > 0) {
            const findBookedTable = table.OutletTableBooking.filter(
              (bookedTable) => {
                const bookingStartTime = moment(
                  bookedTable.bookingStartTime
                ).tz(outlet.timezone);
                const bookingEndTime = moment(bookedTable.bookingEndTime).tz(
                  outlet.timezone
                );

                if (
                  bookingStartTime.isBetween(
                    startDateTime,
                    endDateTime,
                    undefined,
                    "[]"
                  ) ||
                  bookingEndTime.isBetween(
                    startDateTime,
                    endDateTime,
                    undefined,
                    "[]"
                  )
                ) {
                  return bookedTable;
                }
                return null;
              }
            );

            Log.writeLog(
              Loglevel.INFO,
              moduleName,
              "bookedTable Found",
              bookedTable,
              uniqueId
            );

            if (findBookedTable.length > 0) {
              return table;
            }
          }
          return null;
        });

        const availableTable = outletTables.filter((table) => {
          if (
            bookedTable.find(
              (outletbookedTable) => outletbookedTable.id === table.id
            )
          ) {
            return null;
          }
          return table;
        });

        Log.writeLog(
          Loglevel.INFO,
          moduleName,
          "availableTable Found",
          availableTable,
          uniqueId
        );

        if (isCheckTableAvailibility && availableTable.length === 0) {
          return null;
        }

        let bookedCount = 0;
        bookedTable.map((table) => {
          if (table.Table) {
            bookedCount += table.Table.noOfPerson;
          }
        });

        if (
          outlet.paxSpacing < bookedCount + Number(noOfPerson) &&
          (timeSlotRequest.checkPax == false || isCheckTableAvailibility)
        ) {
          //we reached the threshold value
          return null;
        }
        return timeSlot;
      } else {
        if (
          findValidGroupPossibitilyTable &&
          findValidGroupPossibitilyTable.length > 0
        ) {
          let availablePossibilities = findValidGroupPossibitilyTable.map(
            (possibility) => {
              const outletTables =
                possibility.OutletTable as OutletTableDbModel[];
              const bookedTable = outletTables.filter((outletTable) => {
                if (
                  outletTable.OutletTableBooking &&
                  outletTable.OutletTableBooking.length > 0
                ) {
                  const findBookedTable = outletTable.OutletTableBooking.filter(
                    (bookedTable) => {
                      const bookingStartTime = moment(
                        bookedTable.bookingStartTime
                      ).tz(outlet.timezone);
                      const bookingEndTime = moment(
                        bookedTable.bookingEndTime
                      ).tz(outlet.timezone);

                      if (
                        bookingStartTime.isBetween(
                          startDateTime,
                          endDateTime,
                          undefined,
                          "[]"
                        ) ||
                        bookingEndTime.isBetween(
                          startDateTime,
                          endDateTime,
                          undefined,
                          "[]"
                        )
                      ) {
                        return bookedTable;
                      }
                      return null;
                    }
                  );

                  if (findBookedTable.length > 0) {
                    return outletTable;
                  }
                }
                return null;
              });

              if (bookedTable.length > 0) {
                return null;
              }

              return possibility;
            }
          );

          availablePossibilities = lodash.compact(availablePossibilities);

          if (isCheckTableAvailibility && availablePossibilities.length === 0) {
            return null;
          }

          return timeSlot;
        }
        return null;
      }
    });

    //Check Timslot in Ticketing
    if (finalTimeSlots.length > 0 && tickets.length > 0) {
      finalTimeSlots = finalTimeSlots.filter((timeSlot) => {
        if (timeSlot) {
          let startDateTime = getOutletDateTime(
            outlet.timezone,
            timeSlot,
            timeSlotRequest.date
          );

          let endDateTime = moment(startDateTime)
            .add(outlet.timeSlotInterval, "minutes")
            .subtract(1, "minutes");

          const findTicket = tickets.filter((ticket) => {
            const ticketStartTime = getOutletDateTime(
              outlet.timezone,
              ticket.openingTime,
              timeSlotRequest.date
            );

            const ticketEndTime = getOutletDateTime(
              outlet.timezone,
              ticket.closingTime,
              timeSlotRequest.date
            );

            if (
              startDateTime.isBetween(
                ticketStartTime,
                ticketEndTime,
                undefined,
                "[]"
              ) ||
              endDateTime.isBetween(
                ticketStartTime,
                ticketEndTime,
                undefined,
                "[]"
              )
            ) {
              return ticket;
            }
            return null;
          });

          if (findTicket.length > 0) {
            return null;
          }

          return timeSlot;
        }
        return null;
      });
    }

    return lodash.compact(finalTimeSlots);
  } catch (error) {
    throw error;
  }
};

export const getTradingHours = async (
  outlet: OutletDbModel,
  timeSlotRequest: TimeSlotRequest,
  dayofweek: string,
  sequelize: Sequelize,
  uniqueId: string,
  isCheckTableAvailibility: boolean = false
): Promise<FutureTradingHours[]> => {
  const requestStartDate = moment(timeSlotRequest.date, "DD-MM-YYYY")
    .tz(outlet.timezone)
    .startOf("day");

  const requestEndDate = moment(timeSlotRequest.date, "DD-MM-YYYY")
    .tz(outlet.timezone)
    .endOf("day");

  let currentOutletTime = moment().tz(outlet.timezone);

  //check blockTime
  if (timeSlotRequest.checkPax === false) {
    currentOutletTime = moment()
      .tz(outlet.timezone)
      .add(outlet?.blockTime, "minutes");
  }

  let trandingHours: FutureTradingHours[] = getTradingHoursBydate(
    outlet,
    requestStartDate,
    dayofweek
  );
  Log.writeLog(
    Loglevel.INFO,
    moduleName,
    Actions.GET,
    "TradingHours Found",
    uniqueId
  );

  const timeSlots: string[] = await getValidTimeSlot(
    timeSlotRequest,
    requestStartDate,
    requestEndDate,
    outlet,
    trandingHours,
    dayofweek,
    currentOutletTime,
    sequelize,
    uniqueId,
    isCheckTableAvailibility
  );
  Log.writeLog(
    Loglevel.INFO,
    moduleName,
    Actions.GET,
    "Valid TimeSlot Found",
    uniqueId
  );

  trandingHours = trandingHours.map((trandingHour) => {
    return { ...trandingHour, timeSlots };
  });

  return trandingHours;
};
