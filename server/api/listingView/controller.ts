import { Response, NextFunction } from "express";
import multer from "multer";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Loglevel,
  Actions,
  LogTypes,
  BookingStatus,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import {
  BookingTablePayload,
  NewPrivateEventBookingPayload,
  NewReservationBookingPayload,
  PrivateEventPayload,
} from "../../@types/booking";
import { getGuid } from "../../context/service";
import {
  OutletDbInterface,
  OutletTableDbInterface,
  UserDbInterface,
  OutletSeatingTypeDbInterface,
} from "../../db-interfaces";
import { CustomerBookingPayload } from "../../@types/customerBooking";
import { imageLocation } from "../../config";
import {
  checkTableAvailbility,
  CustomerBookingForListingView,
  getAdminUser,
  getMealType,
  getOutletDateTime,
} from "../shared";
import { Log } from "../../context/Logs";
import { IamgeUpload } from "../../@types/common";
import { Op } from "sequelize";
let moment = require("moment-timezone");

const moduleName = "ListingView";

//File Upload
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageLocation.invoiceFilePath);
  },
  filename: (req, file, cb) => {
    const getExtension = file.originalname.toString().split(".")[1];
    cb(null, getGuid() + "." + getExtension); //Appending .jpg
  },
});

export const upload = multer({
  storage: fileStorageEngine,
}).array("image", 10);

export const getAvalibleTables = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet: any = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetAvalibleTables",
      body,
      uniqueId
    );

    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetAvalibleTables",
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetAvalibleTables",
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const bookingTablePayload: BookingTablePayload = body;

    const currentOutletTime = moment().tz(outlet.timezone);

    let bookingStartTime = getOutletDateTime(
      outlet.timezone,
      bookingTablePayload.startTime,
      bookingTablePayload.date
    );

    const bookingEndTime = moment(bookingStartTime)
      .add(outlet.rebookingTableInterval, "minutes")
      .subtract(1, "minutes");

    //check requested date is past date or not
    const checkdate = bookingStartTime.isBefore(currentOutletTime);
    if (checkdate) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //check bookingStartTime is smaller than bookingEndTime
    const check = bookingEndTime.isBefore(bookingStartTime);
    if (check) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const noOfPerson =
      Number(bookingTablePayload.noOfAdult) +
      Number(bookingTablePayload.noOfChild);

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
      moduleName,
      "GetAvalibleTables",
      "Valid Request",
      uniqueId
    );

    //Check OutletSeatingType
    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );

    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        bookingTablePayload.outletSeatingTypeId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "OutletSeatingType Found",
      uniqueId
    );

    const NormalDateStartDateTime = new Date(bookingStartTime);
    const NormalDateEndDateTime = new Date(bookingEndTime);

    let query: any = {
      bookingEndTime: {
        [Op.gte]: new Date(),
      },
      status: {
        [Op.and]: [
          { [Op.notLike]: BookingStatus.LEFT },
          { [Op.notLike]: BookingStatus.CANCELLED },
          { [Op.notLike]: BookingStatus.NOSHOW },
        ],
      },
      [Op.or]: [
        {
          [Op.or]: [
            {
              bookingStartTime: {
                [Op.between]: [NormalDateStartDateTime, NormalDateEndDateTime],
              },
            },
            {
              bookingEndTime: {
                [Op.between]: [NormalDateStartDateTime, NormalDateEndDateTime],
              },
            },
          ],
        },
        {
          [Op.and]: [
            {
              bookingStartTime: {
                [Op.lt]: NormalDateStartDateTime,
              },
            },
            {
              bookingEndTime: {
                [Op.gt]: NormalDateEndDateTime,
              },
            },
          ],
        },
      ],
    };

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    const listingView = await outletTableDbInterface.getAllTablesForListingView(
      outletSeatingType.id,
      outlet.id,
      query
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "GetAvalibleTables",
      body,
      listingView,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: listingView,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "GetAvalibleTables",
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

export const getAvalibleTablesForPrivateEvent = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet: any = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetAvalibleTables",
      body,
      uniqueId
    );

    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetAvalibleTables",
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "GetAvalibleTables",
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const privateEventPayload: PrivateEventPayload = body;

    const noOfPerson =
      Number(privateEventPayload.noOfAdult) +
      Number(privateEventPayload.noOfChild);

    const currentOutletTime = moment().tz(outlet.timezone);

    const bookingStartTime = getOutletDateTime(
      outlet.timezone,
      privateEventPayload.startTime,
      privateEventPayload.startDate
    );

    const bookingEndTime = getOutletDateTime(
      outlet.timezone,
      privateEventPayload.endTime,
      privateEventPayload.endDate
    );

    //check requested date is past date or not
    const checkdate = bookingStartTime.isBefore(currentOutletTime);
    if (checkdate) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //check bookingStartTime is smaller than bookingEndTime
    const check = bookingEndTime.isBefore(bookingStartTime);
    if (check) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //Check OutletSeatingType
    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        privateEventPayload.outletSeatingTypeId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "OutletSeatingType Found",
      uniqueId
    );

    const NormalDateStartDateTime = new Date(bookingStartTime);
    const NormalDateEndDateTime = new Date(bookingEndTime);

    let query: any = {
      bookingEndTime: {
        [Op.gte]: new Date(),
      },
      status: {
        [Op.and]: [
          { [Op.notLike]: BookingStatus.LEFT },
          { [Op.notLike]: BookingStatus.CANCELLED },
          { [Op.notLike]: BookingStatus.NOSHOW },
        ],
      },
      [Op.or]: [
        {
          [Op.or]: [
            {
              bookingStartTime: {
                [Op.between]: [NormalDateStartDateTime, NormalDateEndDateTime],
              },
            },
            {
              bookingEndTime: {
                [Op.between]: [NormalDateStartDateTime, NormalDateEndDateTime],
              },
            },
          ],
        },
        {
          [Op.and]: [
            {
              bookingStartTime: {
                [Op.lt]: NormalDateStartDateTime,
              },
            },
            {
              bookingEndTime: {
                [Op.gt]: NormalDateEndDateTime,
              },
            },
          ],
        },
      ],
    };

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    const listingView = await outletTableDbInterface.getAllTablesForListingView(
      outletSeatingType.id,
      outlet.id,
      query
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "GetAvalibleTables",
      listingView,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: listingView,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "GetAvalibleTables",
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

export const newReservationBooking = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);
    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }
    const newReservationBookingPayload: NewReservationBookingPayload = body;

    const noOfPerson =
      Number(newReservationBookingPayload.noOfAdult) +
      Number(newReservationBookingPayload.noOfChild);

    const currentOutletTime = moment().tz(outlet.timezone);

    let bookingStartTime = getOutletDateTime(
      outlet.timezone,
      newReservationBookingPayload.startTime,
      newReservationBookingPayload.date
    );

    const bookingEndTime = moment(bookingStartTime)
      .add(outlet.rebookingTableInterval, "minutes")
      .subtract(1, "minutes");

    //check requested date is past date or not
    const checkdate = bookingStartTime.isBefore(currentOutletTime);
    if (checkdate) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //check bookingStartTime is smaller than bookingEndTime
    const check = bookingEndTime.isBefore(bookingStartTime);
    if (check) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }
    const outletTableDbInterface = new OutletTableDbInterface(sequelize);

    const outletTableIds = newReservationBookingPayload.outletTables.split(",");
    const ids: number[] = [];

    outletTableIds.map((id) => {
      ids.push(parseInt(id));
    });

    const checkTable = await outletTableDbInterface.checkTableBooking(
      new Date(bookingStartTime),
      new Date(bookingEndTime),
      ids
    );

    if (checkTable.length > 0) {
      throw new ApiError({
        message: Exceptions.BOOKING_TIMESLOTS_FULL,
        statusCode: StatusCode.NOTFOUND,
      });
    }
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "Table Available",
      uniqueId
    );

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.invoiceFilePath, "images/")
        .replace(/\s/g, "");

      newReservationBookingPayload.image = image;
    }

    const extactTime = bookingStartTime.format("HH:mm");

    const mealType = await getMealType(
      bookingStartTime,
      extactTime,
      outlet.id,
      sequelize,
      uniqueId
    );

    const outletTables = await outletTableDbInterface.getTablesForBooking(ids);

    const customerBookingPayload: CustomerBookingPayload = {
      outletId: outletId,
      name: newReservationBookingPayload.name,
      lastName: newReservationBookingPayload.lastName,
      email: newReservationBookingPayload.email,
      mobileNo: newReservationBookingPayload.mobileNo,
      noOfPerson: noOfPerson,
      noOfAdult: newReservationBookingPayload.noOfAdult,
      noOfChild: newReservationBookingPayload.noOfChild,
      bookingStartTime: bookingStartTime,
      bookingEndTime: bookingEndTime,
      mealType: mealType ? mealType.name : "",
      bookingType: newReservationBookingPayload.bookingType,
      specialRequest: newReservationBookingPayload.specialRequest,
      reservationNotes: newReservationBookingPayload.reservationNotes,
      image: newReservationBookingPayload.image,
      outletTable: outletTables,
      exactTime: extactTime,
      outlet: outlet,
      user,
    };

    const customerBooking = await CustomerBookingForListingView(
      customerBookingPayload,
      sequelize,
      uniqueId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      body,
      customerBooking,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Booking done successfull",
        data: customerBooking,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "NewBooking",
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

export const privateEventBooking = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);
    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }
    const newPrivateEventBookingPayload: NewPrivateEventBookingPayload = body;

    const noOfPerson =
      Number(newPrivateEventBookingPayload.noOfAdult) +
      Number(newPrivateEventBookingPayload.noOfChild);

    const currentOutletTime = moment().tz(outlet.timezone);

    const bookingStartTime = getOutletDateTime(
      outlet.timezone,
      newPrivateEventBookingPayload.startTime,
      newPrivateEventBookingPayload.startDate
    );

    const bookingEndTime = getOutletDateTime(
      outlet.timezone,
      newPrivateEventBookingPayload.endTime,
      newPrivateEventBookingPayload.endDate
    );

    //check requested date is past date or not
    const checkdate = bookingStartTime.isBefore(currentOutletTime);
    if (checkdate) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //check bookingStartTime is smaller than bookingEndTime
    const check = bookingEndTime.isBefore(bookingStartTime);
    if (check) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }
    const outletTableDbInterface = new OutletTableDbInterface(sequelize);

    const outletTableIds =
      newPrivateEventBookingPayload.outletTables.split(",");
    const ids: number[] = [];

    outletTableIds.map((id) => {
      ids.push(parseInt(id));
    });

    const checkTable = await outletTableDbInterface.checkTableBooking(
      new Date(bookingStartTime),
      new Date(bookingEndTime),
      ids
    );

    if (checkTable.length > 0) {
      throw new ApiError({
        message: Exceptions.BOOKING_TIMESLOTS_FULL,
        statusCode: StatusCode.NOTFOUND,
      });
    }
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "Table Available",
      uniqueId
    );

    const fileUpload: IamgeUpload[] = [];

    if (req.files.length > 0) {
      req.files.map((image: any) => {
        const path = image.path
          .replace(imageLocation.invoiceFilePath, "images/")
          .replace(/\s/g, "");

        fileUpload.push({
          fileName: image.originalname,
          path,
        });
      });
    }

    newPrivateEventBookingPayload.image = JSON.stringify(fileUpload);

    const extactTime = bookingStartTime.format("HH:mm");

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "MealType Found",
      uniqueId
    );

    const outletTables = await outletTableDbInterface.getTablesForBooking(ids);

    const customerBookingPayload: CustomerBookingPayload = {
      outletId: outletId,
      name: newPrivateEventBookingPayload.name,
      lastName: newPrivateEventBookingPayload.lastName,
      email: newPrivateEventBookingPayload.email,
      mobileNo: newPrivateEventBookingPayload.mobileNo,
      noOfPerson: noOfPerson,
      noOfAdult: newPrivateEventBookingPayload.noOfAdult,
      noOfChild: newPrivateEventBookingPayload.noOfChild,
      bookingStartTime: bookingStartTime,
      bookingEndTime: bookingEndTime,
      bookingType: newPrivateEventBookingPayload.bookingType,
      mealType: newPrivateEventBookingPayload.mealType,
      specialRequest: newPrivateEventBookingPayload.specialRequest,
      reservationNotes: newPrivateEventBookingPayload.reservationNotes,
      image: newPrivateEventBookingPayload.image,
      outletTable: outletTables,
      exactTime: extactTime,
      price: newPrivateEventBookingPayload.price,
      outlet: outlet,
      user,
    };

    const customerBooking = await CustomerBookingForListingView(
      customerBookingPayload,
      sequelize,
      uniqueId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      body,
      customerBooking,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Booking done successfull",
        data: customerBooking,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "NewBooking",
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
