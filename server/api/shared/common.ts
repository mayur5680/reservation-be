import { Op, Sequelize } from "sequelize";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import {
  BookingStatus,
  FrontEndBaseURL,
  Loglevel,
  StatusCode,
} from "../../context";
import {
  BookTablePayload,
  BasketItem,
  DiningOptionsPayload,
  PrivateRoomPayload,
  Step4Payload,
} from "../../@types/customerBooking";
import {
  DiningOptionDbInterface,
  OutletInvoiceDbInterface,
  PreOrderItemDbInterface,
  ShortenLinkDbInterface,
  TableSectionDbInterface,
  UserDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import {
  OutletDbModel,
  OutletInvoiceDbModel,
  OutletTableDbModel,
  TableSectionDbModel,
  UserDbModel,
} from "../../db/models";
import { ContentChangesPayload } from "../../@types/customer";
import { dayMaxQtyDiningOption } from "./diningOption";
import { dayMaxQtyPreOrderItem } from "./getMenu";
import { isObject, compact } from "lodash";
let moment = require("moment-timezone");
const moduleName = "Common";
var shortUrl = require("node-url-shortener");
let adminUser: UserDbModel | null = null;

export const getOutletDateTime = (
  timeZone: string,
  time: string,
  requestedDate?: Date
) => {
  let startDayDateTime = moment().tz(timeZone).startOf("day");

  if (requestedDate) {
    startDayDateTime = moment(requestedDate, "DD-MM-YYYY")
      .tz(timeZone)
      .startOf("day");
  }

  const starTime = time.split(":");
  if (starTime.length !== 2) {
    throw new ApiError({
      message: Exceptions.INVALID_DATE_TIME,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }

  const FormatedDate = moment(startDayDateTime).set({
    hour: starTime[0],
    minute: starTime[1],
  });

  return FormatedDate;
};

export const basketTransform = async (
  bookTablePayload: BookTablePayload,
  outlet: OutletDbModel,
  uniqueId: string,
  sequelize: Sequelize
): Promise<BookTablePayload> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "basketTransform",
      bookTablePayload,
      uniqueId
    );

    const noOfPerson =
      Number(bookTablePayload.noOfAdult) + Number(bookTablePayload.noOfChild);

    const preOrderItemDbInterface = new PreOrderItemDbInterface(sequelize);

    let basketItem: BasketItem[] = [];
    let basketAmount = 0;
    let originalTotalAmount = 0;

    //find all booking of that perticular date
    const getInvoices = await getAllInvoiceByDate(
      bookTablePayload.date,
      outlet,
      sequelize,
      uniqueId
    );

    let ids: number[] = [];

    if (bookTablePayload.basket.items?.length > 0) {
      bookTablePayload.basket.items.map((item) => {
        ids.push(item.itemId);
      });
    }

    const preOrders = await preOrderItemDbInterface.getAllPreOrderItemById(ids);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "preOrders Found",
      preOrders,
      uniqueId
    );

    if (bookTablePayload.basket.items?.length === preOrders.length) {
      await Promise.all(
        bookTablePayload.basket.items.map(async (item) => {
          const preOrder = preOrders.find(
            (preorder) => preorder.id === item.itemId
          );
          if (preOrder) {
            const count = await dayMaxQtyPreOrderItem(
              preOrder,
              getInvoices,
              uniqueId
            );

            const dailyTotalQtyleft = Number(item.qty) + Number(count);

            if (dailyTotalQtyleft > preOrder.dailyMaxQty) {
              throw new ApiError({
                message: Exceptions.CUSTOM_ERROR,
                devMessage: `Daily limit exceeded for ${preOrder.name}`,
                statusCode: StatusCode.BAD_REQUEST,
              });
            }

            basketAmount += Number(item.qty) * preOrder.price;
            originalTotalAmount += Number(item.qty) * preOrder.originalPrice;
            basketItem.push({
              itemId: item.itemId,
              qty: item.qty,
              name: preOrder.name,
              price: preOrder.price,
              originalAmount: preOrder.originalPrice,
              image: preOrder.image,
              description: preOrder.description,
              total: Number(item.qty) * preOrder.price,
              originalTotalAmount: Number(item.qty) * preOrder.originalPrice,
            });
          }
        })
      );

      bookTablePayload.basket.items = basketItem;
    } else {
      throw new ApiError({
        message: Exceptions.INVALID_BASKET,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //Calculate Dining Option
    let dinningOptionsIds: number[] = [];
    let diningOptionsPayload: DiningOptionsPayload[] = [];
    let totalQty = 0;

    const diningOptionDbInterface = new DiningOptionDbInterface(sequelize);

    if (
      bookTablePayload.diningOptions &&
      bookTablePayload.diningOptions.length > 0
    ) {
      bookTablePayload.diningOptions.map((diningOption) => {
        totalQty += Number(diningOption.diningOptionQty);
        dinningOptionsIds.push(diningOption.diningOptionId);
      });
    }

    if (totalQty > Number(noOfPerson)) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage:
          "Total quantity of dinningOption cannot greater than No of pax",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const dinningOptions =
      await diningOptionDbInterface.getAllDiningOptionByIds(dinningOptionsIds);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "Dining Options Found",
      dinningOptions,
      uniqueId
    );

    if (dinningOptions.length !== bookTablePayload.diningOptions.length) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Something wrong with dinningOption",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    await Promise.all(
      bookTablePayload.diningOptions.map(async (data) => {
        const diningOption = dinningOptions.find(
          (dinningOption) => dinningOption.id === data.diningOptionId
        );

        if (diningOption) {
          if (diningOption.bookingMaxQty < Number(data.diningOptionQty)) {
            throw new ApiError({
              message: Exceptions.CUSTOM_ERROR,
              devMessage: `${diningOption.name} cannot book more than ${diningOption.bookingMaxQty}`,
              statusCode: StatusCode.BAD_REQUEST,
            });
          }

          const count = await dayMaxQtyDiningOption(
            diningOption,
            getInvoices,
            uniqueId
          );

          const dailyTotalQtyleft =
            Number(data.diningOptionQty) + Number(count);

          if (dailyTotalQtyleft > diningOption.dailyMaxQty) {
            throw new ApiError({
              message: Exceptions.CUSTOM_ERROR,
              devMessage: `Daily limit exceeded for ${diningOption.name}`,
              statusCode: StatusCode.BAD_REQUEST,
            });
          }

          basketAmount += Number(data.diningOptionQty) * diningOption.price;
          originalTotalAmount +=
            Number(data.diningOptionQty) * diningOption.originalPrice;

          diningOptionsPayload.push({
            diningOptionId: data.diningOptionId,
            diningOptionQty: data.diningOptionQty,
            name: diningOption.name,
            price: diningOption.price,
            originalAmount: diningOption.originalPrice,
            image: diningOption.image,
            total: Number(data.diningOptionQty) * diningOption.price,
            originalTotalAmount:
              Number(data.diningOptionQty) * diningOption.originalPrice,
          });
        }
      })
    );

    //Calculate Private Room

    let privateRoomPayload: PrivateRoomPayload | null = null;

    const tableSectionDbInterface = new TableSectionDbInterface(sequelize);

    if (bookTablePayload.privateRoom) {
      if (bookTablePayload.privateRoom.overridePrivateRoom === true) {
        privateRoomPayload = bookTablePayload.privateRoom;
      } else {
        const section = await tableSectionDbInterface.getTablSectioneById(
          bookTablePayload.privateRoom?.id
        );

        basketAmount += Number(section.price);

        originalTotalAmount += Number(section.originalPrice);

        privateRoomPayload = {
          id: section.id,
          name: section.name,
          price: section.price,
          originalPrice: section.originalPrice,
          image: section.image,
        };
      }
    }

    bookTablePayload.basket.total = basketAmount;
    bookTablePayload.diningOptions = diningOptionsPayload;
    bookTablePayload.basket.originalTotalAmount = originalTotalAmount;
    bookTablePayload.privateRoom = privateRoomPayload;

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "basketTransform",
      bookTablePayload,
      uniqueId
    );
    return bookTablePayload;
  } catch (error) {
    throw error;
  }
};

export const getAdminUser = async (
  sequelize: Sequelize
): Promise<UserDbModel> => {
  if (adminUser) {
    return adminUser;
  }
  const userDbInterface = new UserDbInterface(sequelize);
  adminUser = await userDbInterface.checkUserById(1);
  return adminUser;
};

export const getUpdateBy = (user: UserDbModel): string => {
  const updatedBy = "".concat(
    user.firstName ? user.firstName : "",
    " ",
    user.lastName ? user.lastName : "",
    ",",
    user.email
  );
  return updatedBy;
};

export const contentChanges = (
  previousModel: any,
  updatedModel: any
): string => {
  try {
    let contentChangesPayload: ContentChangesPayload = {
      name: updatedModel.name ? updatedModel.name : "",
      contentChange: [],
    };

    Object.keys(updatedModel).map((field) => {
      if (
        field !== "updatedAt" &&
        field !== "updatedBy" &&
        field !== "createdAt" &&
        updatedModel[field] !== previousModel[field] &&
        !isObject(updatedModel[field])
      ) {
        contentChangesPayload.contentChange.push({
          filedName: field,
          oldValue: previousModel[field],
          newValue: updatedModel[field],
        });
      }
    });

    const contentChange = JSON.stringify(contentChangesPayload);

    return contentChange;
  } catch (error) {
    throw error;
  }
};

export const getAllInvoiceByDate = async (
  requestDate: Date,
  outlet: OutletDbModel,
  sequelize: Sequelize,
  uniqueId: string
): Promise<OutletInvoiceDbModel[]> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "getAllInvoiceByDate",
      "requestDate",
      requestDate,
      uniqueId
    );

    let requestStartTime = moment(requestDate, "DD-MM-YYYY")
      .tz(outlet.timezone)
      .startOf("day");

    let requestEndTime = moment(requestDate, "DD-MM-YYYY")
      .tz(outlet.timezone)
      .endOf("day");

    let query: any = {
      outletId: outlet.id,
      status: {
        [Op.and]: [
          { [Op.notLike]: BookingStatus.LEFT },
          { [Op.notLike]: BookingStatus.CANCELLED },
          { [Op.notLike]: BookingStatus.NOSHOW },
        ],
      },
      bookingStartTime: {
        [Op.between]: [requestStartTime, requestEndTime],
      },
    };

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);

    let getInvoices = (
      await outletInvoiceDbInterface.getInvoiceByFilter(query)
    ).map((invoice) => {
      return {
        ...invoice.toJSON(),
        dinningOptions: invoice.dinningOptions
          ? JSON.parse(invoice.dinningOptions)
          : [],
        basket: invoice.basket ? JSON.parse(invoice.basket) : [],
      };
    });

    Log.writeLog(
      Loglevel.INFO,
      "getAllInvoiceByDate",
      "getInvoices",
      getInvoices,
      uniqueId
    );

    return getInvoices;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "getAllInvoiceByDate",
      "error",
      error,
      uniqueId
    );
    throw error;
  }
};

export const shortenUrl = async (
  link: string,
  sequelize: Sequelize
): Promise<string> => {
  try {
    const shortenLinkDbInterface = new ShortenLinkDbInterface(sequelize);

    const code = await validCode(sequelize);

    const createdShortenUrl = await shortenLinkDbInterface.create(code, link);

    return `${FrontEndBaseURL}/${createdShortenUrl.code}`;
  } catch (error) {
    throw error;
  }
};

export const MailChimpServerName = async (api: string): Promise<string> => {
  try {
    return api.split("-")[1];
  } catch (error) {
    throw error;
  }
};

const generateRandomString = (length: number): string => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const validCode = async (sequelize: Sequelize): Promise<string> => {
  const getCode = generateRandomString(5);
  //Db call

  const shortenLinkDbInterface = new ShortenLinkDbInterface(sequelize);
  const createdShortenUrl = await shortenLinkDbInterface.getShortenLinkByCode(
    getCode
  );

  if (createdShortenUrl) {
    return await validCode(sequelize);
  }

  return getCode;
};

export const getAvaliblePrivateRoom = async (
  outlet: OutletDbModel,
  noOfPerson: number,
  currentOutletTime: any,
  startDateTime: any,
  endDateTime: any,
  sequelize: Sequelize,
  uniqueId: string
): Promise<TableSectionDbModel[]> => {
  try {
    const tableSectionDbInterface = new TableSectionDbInterface(sequelize);

    let findPrivateRoom =
      await tableSectionDbInterface.checkPrivateSectionAvailibilty(
        outlet.id,
        startDateTime,
        endDateTime,
        noOfPerson
      );

    Log.writeLog(
      Loglevel.INFO,
      "getAvaliblePrivateRoom",
      "Find-Private-Room",
      findPrivateRoom,
      uniqueId
    );

    let availablePrivateRoom = compact(
      findPrivateRoom.map((section) => {
        const outletTables = section.OutletTable as OutletTableDbModel[];

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

            if (findBookedTable.length > 0) {
              return outletTable;
            }
          }
          return null;
        });

        if (bookedTable.length > 0) {
          return null;
        }

        return section;
      })
    );

    //check blocktime
    availablePrivateRoom = compact(
      availablePrivateRoom.map((section) => {
        const blockedTime = moment(currentOutletTime).add(
          section?.blockTime,
          "minutes"
        );
        const checktime = startDateTime.isBefore(blockedTime);
        if (checktime) {
          return null;
        }
        return section;
      })
    );

    Log.writeLog(
      Loglevel.INFO,
      "Step-4",
      "Avilable-Private-Room",
      availablePrivateRoom,
      uniqueId
    );

    return availablePrivateRoom;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "getAvaliblePrivateRoom",
      "error",
      error,
      uniqueId
    );

    throw error;
  }
};

export const convertMinutes = (minutes: number) => {
  const days = Math.floor(minutes / 1440); // 1440 minutes in a day
  const hours = Math.floor((minutes % 1440) / 60); // remaining minutes to hours
  const mins = minutes % 60; // remaining minutes

  let message = "booking required ";
  if (days) message = message + `${days} days `;
  if (hours) message = message + `${hours} hours `;
  if (mins) message = message + `${mins} minutes `;

  message = message + `in advance`;

  return message;
};
