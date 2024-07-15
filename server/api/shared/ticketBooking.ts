import { Sequelize } from "sequelize";
import {
  GroupPossibilityDbModel,
  OutletTableDbModel,
  TicketingDbModel,
} from "../../db/models";
import { Loglevel, StatusCode } from "../../context";
import {
  GroupPossibilityDbInterface,
  OutletDbInterface,
  OutletInvoiceDbInterface,
  OutletTableDbInterface,
} from "../../db-interfaces";
import { TicketTimeSlotRequest } from "../../@types/ticketBooking";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { getOutletDateTime } from ".";
import lodash from "lodash";
import { Log } from "../../context/Logs";
let moment = require("moment-timezone");

export const checkBookingTicket = async (
  ticket: TicketingDbModel,
  ticketTimeSlotRequest: TicketTimeSlotRequest,
  sequelize: Sequelize
): Promise<void> => {
  const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
  const invoices = await outletInvoiceDbInterface.getInvoiceByTicketId(
    ticket.id
  );

  let noOfPerson: number = 0;
  if (invoices && invoices.length > 0) {
    invoices.map((invoice) => {
      noOfPerson += invoice.noOfPerson;
    });
  }

  const noOfPersonRequest =
    Number(ticketTimeSlotRequest.noOfAdult) +
    Number(ticketTimeSlotRequest.noOfChild);

  noOfPerson = noOfPerson + Number(noOfPersonRequest);

  if (Number(ticket.noOfPerson) < noOfPerson) {
    throw new ApiError({
      message: Exceptions.INVALID_TABLE_CAPACITY,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const ticketTimeSlot = async (
  ticket: TicketingDbModel,
  ticketTimeSlotRequest: TicketTimeSlotRequest,
  sequelize: Sequelize,
  uniqueId: string
): Promise<string[]> => {
  const outletDbInterface = new OutletDbInterface(sequelize);
  const outlet = await outletDbInterface.getOutletbyId(ticket.outletId);

  const noOfPerson =
    Number(ticketTimeSlotRequest.noOfAdult) +
    Number(ticketTimeSlotRequest.noOfChild);

  const requestStartDate = moment(ticketTimeSlotRequest.date, "DD-MM-YYYY")
    .tz(outlet.timezone)
    .startOf("day");

  const requestEndDate = moment(ticketTimeSlotRequest.date, "DD-MM-YYYY")
    .tz(outlet.timezone)
    .endOf("day");

  const ticketStartTime = getOutletDateTime(
    outlet.timezone,
    ticket.openingTime,
    ticketTimeSlotRequest.date
  );

  const ticketEndTime = getOutletDateTime(
    outlet.timezone,
    ticket.closingTime,
    ticketTimeSlotRequest.date
  );

  const currentOutletTime = moment().tz(outlet.timezone);

  const timeSlots: string[] = [];

  const startTime = moment(ticketStartTime, "HH:mm");
  const endTime = moment(ticketEndTime, "HH:mm");
  let time = startTime;

  while (time.isBefore(endTime)) {
    if (time.isBetween(requestStartDate, requestEndDate, undefined, "[]")) {
      if (requestStartDate.isSame(moment().tz(outlet.timezone), "day")) {
        if (time.isSameOrAfter(currentOutletTime)) {
          timeSlots.push(time.format("HH:mm"));
        }
      } else {
        timeSlots.push(time.format("HH:mm"));
      }
    }
    time = moment(time, "HH:mm").add(ticket.timeSlotInterval, "minutes");
  }

  //find Tables
  const outletTableDbInterface = new OutletTableDbInterface(sequelize);
  let outletTables: OutletTableDbModel[];
  let findValidGroupPossibitilyTable: GroupPossibilityDbModel[] | null;

  if (ticket.blockTable === false) {
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

      Log.writeLog(
        Loglevel.INFO,
        "ticketTimeSlot",
        "Possibility Found",
        findValidGroupPossibitilyTable,
        uniqueId
      );
    } else {
      outletTables = await outletTableDbInterface.getAllTables(
        requestStartDate,
        requestEndDate,
        ticket.outletId,
        noOfPerson
      );
      Log.writeLog(
        Loglevel.INFO,
        "ticketTimeSlot",
        "OutletTables Found",
        outletTables,
        uniqueId
      );
    }
  } else {
    const checkCapacity =
      await outletTableDbInterface.checkTableAvaibilityForTicket(
        noOfPerson,
        outlet.id
      );

    if (!checkCapacity) {
      const groupPossibilityDbInterface = new GroupPossibilityDbInterface(
        sequelize
      );

      findValidGroupPossibitilyTable =
        await groupPossibilityDbInterface.checkPossibilityTableForTicketTimeSlot(
          outlet.id,
          requestStartDate,
          requestEndDate
        );

      Log.writeLog(
        Loglevel.INFO,
        "ticketTimeSlot",
        "Possibility Found",
        findValidGroupPossibitilyTable,
        uniqueId
      );
    } else {
      outletTables = await outletTableDbInterface.getAllTablesForTicketing(
        requestStartDate,
        requestEndDate,
        ticket.outletId
      );

      Log.writeLog(
        Loglevel.INFO,
        "ticketTimeSlot",
        "OutletTables Found",
        outletTables,
        uniqueId
      );
    }
  }

  let finalTimeSlots: (string | null)[] = [];
  if (timeSlots.length > 0) {
    finalTimeSlots = timeSlots.map((timeSlot) => {
      let startDateTime = getOutletDateTime(
        outlet.timezone,
        timeSlot,
        ticketTimeSlotRequest.date
      );

      let endDateTime = moment(startDateTime)
        .add(ticket.timeSlotInterval, "minutes")
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
              "ticketTimeSlot",
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
          "ticketTimeSlot",
          "availableTable Found",
          availableTable,
          uniqueId
        );

        if (availableTable.length === 0) {
          return null;
        }

        let bookedCount = 0;
        bookedTable.map((table) => {
          if (table.Table) {
            bookedCount += table.Table.noOfPerson;
          }
        });

        if (outlet.paxSpacing < bookedCount + Number(noOfPerson)) {
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

          if (availablePossibilities.length === 0) {
            return null;
          }

          return timeSlot;
        }
        return null;
      }
    });
  }

  if (finalTimeSlots.length > 0) {
    finalTimeSlots = lodash.compact(finalTimeSlots);
  }
  return finalTimeSlots as string[];
};
