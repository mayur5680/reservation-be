import { Sequelize } from "sequelize";
import {
  OutletDbModel,
  OutletGroupTableDbModel,
  OutletTableDbModel,
  TicketingDbModel,
} from "../../db/models";
import {
  DiningOptionDbInterface,
  GroupPossibilityDbInterface,
  OutletTableDbInterface,
  TableSectionDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { Actions, Loglevel, StatusCode } from "../../context";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import {
  BookTablePayload,
  CustomerBookingPayload,
  PrivateRoomPayload,
} from "../../@types/customerBooking";
import {
  getAvaliblePrivateRoom,
  getCoupon,
  getMealType,
  getOutletDateTime,
} from ".";
import {
  BookTicketPayload,
  CustomerBookingTicketPayload,
} from "../../@types/ticketBooking";
import { checkBookingTicket } from "./ticketBooking";
let moment = require("moment-timezone");

export const checkTableAvailbility = async (
  noOfPerson: number,
  outletId: number,
  sequelize: Sequelize
): Promise<boolean> => {
  const outletTableDbInterface = new OutletTableDbInterface(sequelize);

  //Check person capacity in Table
  const checkCapacity = await outletTableDbInterface.checkTableAvaibility(
    noOfPerson,
    outletId
  );

  if (!checkCapacity) {
    //todo check for normal table
    const groupPossibilityDbInterface = new GroupPossibilityDbInterface(
      sequelize
    );
    const isValid = await groupPossibilityDbInterface.checkTableAvaibility(
      noOfPerson,
      outletId
    );
    if (!isValid) return false;
  }
  return true;
};

export const checkTableAvailbilityForPrivateEvent = async (
  noOfPerson: number,
  outletId: number,
  sequelize: Sequelize
): Promise<boolean> => {
  const outletTableDbInterface = new OutletTableDbInterface(sequelize);

  //Check person capacity in Table
  const checkCapacity = await outletTableDbInterface.checkTableAvaibility(
    noOfPerson,
    outletId
  );

  if (!checkCapacity) {
    const tableSectionDbInterface = new TableSectionDbInterface(sequelize);
    const isValid = await tableSectionDbInterface.checkTableSectionAvailibilty(
      noOfPerson,
      outletId
    );
    if (!isValid) return false;
  }
  return true;
};

//check table and group table
export const checktTableBookingAvailbility = async (
  noOfPerson: number,
  outletId: number,
  requestStartTime: Date,
  requestEndTime: Date,
  uniqueId: string,
  sequelize: Sequelize
): Promise<OutletTableDbModel[]> => {
  const groupPossibilityDbInterface = new GroupPossibilityDbInterface(
    sequelize
  );
  const outletTableDbInterface = new OutletTableDbInterface(sequelize);

  //check person capacity in table
  const checkCapacity = await outletTableDbInterface.checkTableAvaibility(
    noOfPerson,
    outletId
  );

  let bookingOutletTable: OutletTableDbModel[] = [];
  //check reservation data is belongs to single table or not
  if (checkCapacity) {
    const findValidTable = await outletTableDbInterface.checkTable(
      noOfPerson,
      outletId,
      requestStartTime,
      requestEndTime
    );
    if (findValidTable.length > 0) {
      //find table without group
      const tableWithoutGroup = findValidTable.filter(
        (table) => table.OutletGroupTable?.length === 0
      );

      let findValidTables = findValidTable;

      if (tableWithoutGroup.length > 0) {
        findValidTables = tableWithoutGroup;
      }

      //find table without section
      const tableWithoutSection = findValidTables.filter(
        (table) => table.OutletTableSection?.length === 0
      );

      if (tableWithoutSection && tableWithoutSection.length > 0) {
        return [tableWithoutSection[0]];
      }

      Log.writeLog(
        Loglevel.INFO,
        "checktTableBookingAvailbility",
        Actions.GET,
        "Table Found",
        uniqueId
      );
      return [findValidTable[0]];
    }
  }

  const findValidGroupPossibitilyTable =
    await groupPossibilityDbInterface.checkPossibilityTable(
      noOfPerson,
      outletId,
      requestStartTime,
      requestEndTime
    );

  if (findValidGroupPossibitilyTable.length > 0) {
    Log.writeLog(
      Loglevel.INFO,
      "checktTableBookingAvailbility",
      Actions.GET,
      "Possibitily Table Found",
      uniqueId
    );

    findValidGroupPossibitilyTable[0]?.OutletGroupTable?.map(
      (outletGroupTable: OutletGroupTableDbModel) => {
        if (outletGroupTable.OutletTable) {
          bookingOutletTable.push(outletGroupTable.OutletTable);
        }
      }
    );
  } else {
    throw new ApiError({
      message: Exceptions.BOOKING_TIMESLOTS_FULL,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }

  return bookingOutletTable;
};

//check table and section group
export const checktTableBookingAvailbilityForTicket = async (
  noOfPerson: number,
  outletId: number,
  requestStartTime: Date,
  requestEndTime: Date,
  uniqueId: string,
  sequelize: Sequelize
): Promise<OutletTableDbModel[]> => {
  const groupPossibilityDbInterface = new GroupPossibilityDbInterface(
    sequelize
  );
  const outletTableDbInterface = new OutletTableDbInterface(sequelize);

  //check person capacity in table
  const checkCapacity =
    await outletTableDbInterface.checkTableAvaibilityForTicket(
      noOfPerson,
      outletId
    );

  let bookingOutletTable: OutletTableDbModel[] = [];
  //check reservation data is belongs to single table or not
  if (checkCapacity) {
    const findValidTable = await outletTableDbInterface.checkTableForTicketing(
      noOfPerson,
      outletId,
      requestStartTime,
      requestEndTime
    );
    if (findValidTable.length > 0) {
      Log.writeLog(
        Loglevel.INFO,
        "checktTableBookingAvailbility",
        Actions.GET,
        "Table Found",
        uniqueId
      );
      return [findValidTable[0]];
    }
  }

  const findValidGroupPossibitilyTable =
    await groupPossibilityDbInterface.checkPossibilityTableForTicketing(
      noOfPerson,
      outletId,
      requestStartTime,
      requestEndTime
    );

  if (findValidGroupPossibitilyTable.length > 0) {
    Log.writeLog(
      Loglevel.INFO,
      "checktTableBookingAvailbility",
      Actions.GET,
      "Possibitily Table Found",
      uniqueId
    );

    findValidGroupPossibitilyTable[0]?.OutletGroupTable?.map(
      (outletGroupTable: OutletGroupTableDbModel) => {
        if (outletGroupTable.OutletTable) {
          bookingOutletTable.push(outletGroupTable.OutletTable);
        }
      }
    );
  } else {
    throw new ApiError({
      message: Exceptions.BOOKING_TIMESLOTS_FULL,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }

  return bookingOutletTable;
};

//check PrivateRoom
export const checktTableBookingAvailbilityForPrivateRoom = async (
  privateRoomPayload: PrivateRoomPayload,
  requestStartTime: Date,
  requestEndTime: Date,
  uniqueId: string,
  sequelize: Sequelize
): Promise<OutletTableDbModel[]> => {
  const outletTableDbInterface = new OutletTableDbInterface(sequelize);

  const tableSectionDbInterface = new TableSectionDbInterface(sequelize);

  const section = await tableSectionDbInterface.getTablSectioneById(
    privateRoomPayload.id
  );

  //get outletTables
  let outletTablesIds: number[] = [];
  section.OutletTableSection?.map((OutletTableSection) =>
    outletTablesIds.push(OutletTableSection.outletTableId)
  );

  //check tables is booked on that time
  const checkTable = await outletTableDbInterface.checkTableBooking(
    requestStartTime,
    requestEndTime,
    outletTablesIds
  );

  if (checkTable.length > 0) {
    throw new ApiError({
      message: Exceptions.BOOKING_TIMESLOTS_FULL,
      statusCode: StatusCode.NOTFOUND,
    });
  }

  const outletTables = await outletTableDbInterface.getTablesForBooking(
    outletTablesIds
  );

  return outletTables;
};

export const checkTablesForReseration = async (
  bookTablePayload: BookTablePayload,
  outlet: OutletDbModel,
  uniqueId: string,
  sequelize: Sequelize
): Promise<CustomerBookingPayload> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "checkTablesForReseration",
      Actions.GET,
      bookTablePayload,
      uniqueId
    );

    const noOfPerson =
      Number(bookTablePayload.noOfAdult) + Number(bookTablePayload.noOfChild);

    const bookingStartTime = getOutletDateTime(
      outlet.timezone,
      bookTablePayload.exactTime,
      bookTablePayload.date
    );

    const bookingEndTime = moment(bookingStartTime)
      .add(outlet.rebookingTableInterval, "minutes")
      .subtract(1, "minutes");

    const currentOutletTime = moment().tz(outlet.timezone);

    //check requested date is past date or not
    const checkdate = bookingStartTime.isBefore(currentOutletTime);
    if (checkdate) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //check Availibility of table
    const isValidTableRequest = await checkTableAvailbility(
      noOfPerson,
      outlet.id,
      sequelize
    );

    if (!isValidTableRequest) {
      throw new ApiError({
        message: Exceptions.INVALID_TABLE_CAPACITY,
        statusCode: StatusCode.NOTFOUND,
      });
    }
    Log.writeLog(
      Loglevel.INFO,
      "checkTablesForReseration",
      Actions.GET,
      "Valid Request",
      uniqueId
    );

    const diningOptionDbInterface = new DiningOptionDbInterface(sequelize);

    if (
      bookTablePayload.diningOptions &&
      bookTablePayload.diningOptions.length > 0
    ) {
      const dinningOptions = await diningOptionDbInterface.getDiningOptionById(
        bookTablePayload.diningOptions[0].diningOptionId
      );

      if (dinningOptions.overridePrivateRoom) {
        const availablePrivateRoom = await getAvaliblePrivateRoom(
          outlet,
          noOfPerson,
          currentOutletTime,
          bookingStartTime,
          bookingEndTime,
          sequelize,
          uniqueId
        );

        if (availablePrivateRoom.length > 0) {
          const privateRoom: PrivateRoomPayload = {
            id: availablePrivateRoom[0].id,
            name: availablePrivateRoom[0].name,
            price: 0,
            originalPrice: 0,
            image: availablePrivateRoom[0].image,
            overridePrivateRoom: true,
          };
          bookTablePayload.privateRoom = privateRoom;
          bookTablePayload.directPayment = true;
        }
      }
    }

    let isPrivateTableBooked: boolean = true;

    let bookingOutletTable: OutletTableDbModel[] = [];

    if (bookTablePayload.privateRoom) {
      bookingOutletTable = await checktTableBookingAvailbilityForPrivateRoom(
        bookTablePayload.privateRoom,
        new Date(bookingStartTime),
        new Date(bookingEndTime),
        uniqueId,
        sequelize
      );
      Log.writeLog(
        Loglevel.INFO,
        "checkTablesForReseration",
        Actions.GET,
        "Table Found",
        uniqueId
      );
    } else {
      isPrivateTableBooked = false;
      bookingOutletTable = await checktTableBookingAvailbility(
        noOfPerson,
        outlet.id,
        new Date(bookingStartTime),
        new Date(bookingEndTime),
        uniqueId,
        sequelize
      );
      Log.writeLog(
        Loglevel.INFO,
        "checkTablesForReseration",
        Actions.GET,
        "Table Found",
        uniqueId
      );
    }

    const mealType = await getMealType(
      bookingStartTime,
      bookTablePayload.exactTime,
      outlet.id,
      sequelize,
      uniqueId
    );

    const coupon = await getCoupon(bookTablePayload, outlet, sequelize);

    const customerBookingPayload: CustomerBookingPayload = {
      outletId: outlet.id,
      name: bookTablePayload.name,
      lastName: bookTablePayload.lastName,
      email: bookTablePayload.email,
      mobileNo: bookTablePayload.mobileNo,
      customerCompanyName: bookTablePayload.customerCompanyName,
      dietaryRestriction: bookTablePayload.dietaryRestriction,
      noOfPerson: noOfPerson,
      noOfAdult: bookTablePayload.noOfAdult,
      noOfChild: bookTablePayload.noOfChild,
      bookingStartTime: bookingStartTime,
      bookingEndTime: bookingEndTime,
      mealType: mealType ? mealType.name : "",
      bookingType: bookTablePayload.bookingType,
      occasion: bookTablePayload.occasion,
      seatingPreference: bookTablePayload.seatingPreference,
      specialRequest: bookTablePayload.specialRequest,
      reservationNotes: bookTablePayload.reservationNotes,
      salutation: bookTablePayload.salutation,
      promocode: bookTablePayload.promocode,
      outletTable: bookingOutletTable,
      exactTime: bookTablePayload.exactTime,
      isOPT: bookTablePayload.isOPT,
      coupon: coupon,
      outlet: outlet,
      isPrivateTableBooked,
    };
    return customerBookingPayload;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "checkTablesForReseration",
      Actions.GET,
      error,
      uniqueId
    );
    throw error;
  }
};

export const checkTablesForTicketing = async (
  ticket: TicketingDbModel,
  bookTicketPayload: BookTicketPayload,
  outlet: OutletDbModel,
  uniqueId: string,
  sequelize: Sequelize
): Promise<CustomerBookingTicketPayload> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "checkTablesForTicketing",
      Actions.GET,
      bookTicketPayload,
      uniqueId
    );

    const noOfPerson =
      Number(bookTicketPayload.noOfAdult) + Number(bookTicketPayload.noOfChild);

    //check ticket max qty
    if (ticket.ticketMaxQuantity < noOfPerson) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: `Maximum ${ticket.ticketMaxQuantity} pax is available for reservation,please reduce your pax and book again`,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //check Number of Person
    await checkBookingTicket(ticket, bookTicketPayload, sequelize);

    const bookingStartTime = getOutletDateTime(
      outlet.timezone,
      bookTicketPayload.exactTime,
      bookTicketPayload.date
    );

    const bookingEndTime = moment(bookingStartTime)
      .add(outlet.rebookingTableInterval, "minutes")
      .subtract(1, "minutes");

    const openingTime = ticket.openingTime.split(":");

    const ticketStartTime = moment(ticket.startDate)
      .set({
        hour: openingTime[0],
        minute: openingTime[1],
      })
      .tz(ticket.Outlet?.timezone);

    const closingTime = ticket.closingTime.split(":");

    const ticketEndTime = moment(ticket.endDate)
      .set({
        hour: closingTime[0],
        minute: closingTime[1],
      })
      .tz(ticket.Outlet?.timezone);

    //check booking date is between ticket start and end date
    if (
      !bookingStartTime.isBetween(
        ticketStartTime,
        ticketEndTime,
        undefined,
        "[]"
      )
    ) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    let bookingOutletTable: OutletTableDbModel[] = [];
    if (ticket.blockTable === true) {
      bookingOutletTable = await checktTableBookingAvailbilityForTicket(
        noOfPerson,
        outlet.id,
        new Date(bookingStartTime),
        new Date(bookingEndTime),
        uniqueId,
        sequelize
      );
    } else {
      bookingOutletTable = await checktTableBookingAvailbility(
        noOfPerson,
        outlet.id,
        new Date(bookingStartTime),
        new Date(bookingEndTime),
        uniqueId,
        sequelize
      );
    }
    Log.writeLog(
      Loglevel.INFO,
      "checkTablesForTicketing",
      Actions.GET,
      "Table Found",
      uniqueId
    );

    const mealType = await getMealType(
      bookingStartTime,
      bookTicketPayload.exactTime,
      outlet.id,
      sequelize,
      uniqueId
    );

    const customerBookingPayload: CustomerBookingTicketPayload = {
      outletId: outlet.id,
      name: bookTicketPayload.name,
      lastName: bookTicketPayload.lastName,
      email: bookTicketPayload.email,
      mobileNo: bookTicketPayload.mobileNo,
      customerCompanyName: bookTicketPayload.customerCompanyName,
      noOfPerson: noOfPerson,
      noOfAdult: bookTicketPayload.noOfAdult,
      noOfChild: bookTicketPayload.noOfChild,
      mealType: mealType ? mealType.name : "",
      bookingStartTime: bookingStartTime,
      bookingEndTime: bookingEndTime,
      bookingType: bookTicketPayload.bookingType,
      specialRequest: bookTicketPayload.specialRequest,
      salutation: bookTicketPayload.salutation,
      outletTable: bookingOutletTable,
      exactTime: bookTicketPayload.exactTime,
      dietaryRestriction: bookTicketPayload.dietaryRestriction,
      occasion: bookTicketPayload.occasion,
      isOPT: bookTicketPayload.isOPT,
      outlet: outlet,
      ticketing: ticket,
    };

    return customerBookingPayload;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "checkTablesForReseration",
      Actions.GET,
      error,
      uniqueId
    );
    throw error;
  }
};
