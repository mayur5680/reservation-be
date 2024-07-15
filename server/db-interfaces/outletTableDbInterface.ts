import { Op, Sequelize, col, fn } from "sequelize";
import { OutletTable } from "../db/interface";
import { BookingStatus, ExcludeAttributes } from "../context";
import {
  OutletTableDbModel,
  TableDbModel,
  OutletSeatingTypeDbModel,
  OutletSeatTypeDbModel,
  SeatingTypeDbModel,
  SeatTypeDbModel,
  OutletTableBookingDbModel,
  OutletInvoiceDbModel,
  CustomerDbModel,
  OutletTableSectionDbModel,
  TableSectionDbModel,
  UserDbModel,
  OutletGroupTableDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { UpdatePositionPayload, OutletTableData } from "../@types/outletTable";
import { isEmpty } from "lodash";

export class OutletTableDbInterface extends BaseInterface<OutletTableDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletTableDbModel, sequelize);
  }
  public create = async (
    outletTable: OutletTable,
    userId: number
  ): Promise<OutletTableDbModel> => {
    try {
      const createOutletTable = await this.repository.create({
        ...outletTable,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createOutletTable)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createOutletTable;
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletTable = async (
    id: number
  ): Promise<OutletTableDbModel[]> => {
    try {
      const getAllOutletTable = await this.repository.findAll({
        attributes: {
          exclude: ["updatedBy"],
          include: [
            [
              fn(
                "concat",
                col("User.firstName"),
                " ",
                col("User.lastName"),
                ",",
                col("User.email")
              ),
              "updatedBy",
            ],
          ],
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { id, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: ["id"],
      });
      return getAllOutletTable;
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletTableForPrivate = async (
    id: number
  ): Promise<OutletTableDbModel[]> => {
    try {
      const getAllOutletTable = await this.repository.findAll({
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { id, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: ["id"],
      });
      return getAllOutletTable;
    } catch (error) {
      throw error;
    }
  };

  public getOutletTableById = async (
    id: number,
    checkIsActive = true
  ): Promise<OutletTableDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const outletTable = await this.repository.findOne({
        where: query,
        attributes: {
          exclude: ["updatedBy", ...ExcludeAttributes],
          include: [
            [
              fn(
                "concat",
                col("User.firstName"),
                " ",
                col("User.lastName"),
                ",",
                col("User.email")
              ),
              "updatedBy",
            ],
          ],
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!outletTable)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return outletTable;
    } catch (error) {
      throw error;
    }
  };

  //Get Outlet Table by Id and SeatingTypeId
  public getOutletTableByIdAndOutletSeatingTypeId = async (
    ids: number[],
    outletSeatingTypeId: number
  ): Promise<number> => {
    try {
      const outletTable = await this.repository.count({
        where: {
          id: {
            [Op.in]: ids,
          },
          outletSeatingTypeId,
          isActive: true,
        },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      return outletTable;
    } catch (error) {
      throw error;
    }
  };

  public updateOutletTable = async (
    id: number,
    outletTable: OutletTable,
    userId: number
  ): Promise<OutletTableDbModel> => {
    try {
      const updateOutletTable = await this.repository.update(
        { ...outletTable, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateOutletTable[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getOutletTableById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteOutletTable = async (
    id: number,
    userId: number
  ): Promise<OutletTableDbModel> => {
    try {
      const outletTable = await this.getOutletTableById(id, false);
      outletTable.updatedBy = userId;
      await outletTable.save();
      await outletTable.destroy();
      return outletTable;
    } catch (error) {
      throw error;
    }
  };

  public updatePosition = async (
    updatePositionPayload: UpdatePositionPayload,
    userId: number
  ): Promise<void> => {
    try {
      await Promise.all(
        updatePositionPayload.outletTable.map(async (data: OutletTableData) => {
          await this.repository.update(
            {
              xPosition: data.xPosition,
              yPosition: data.yPosition,
              updatedBy: userId,
            },
            {
              where: {
                id: data.id,
              },
            }
          );
        })
      );
    } catch (error) {
      throw error;
    }
  };

  public checkTableAvaibility = async (
    noOfPerson: number,
    outletId: number
  ): Promise<OutletTableDbModel | null> => {
    try {
      const check = await this.repository.findOne({
        where: {
          isPrivate: false,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
              noOfPerson: {
                [Op.gte]: noOfPerson,
              },
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return check;
    } catch (error) {
      throw error;
    }
  };

  public checkTable = async (
    noOfPerson: number,
    outletId: number,
    requestStartTime: Date,
    requestEndTime: Date,
    outletSeatingTypeId?: number
  ): Promise<OutletTableDbModel[]> => {
    try {
      let query: any = { isActive: true, isPrivate: false };
      outletSeatingTypeId !== undefined &&
        (query.outletSeatingTypeId = outletSeatingTypeId);

      const outletTables = await this.repository.findAll({
        where: query,
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
              [Op.and]: [
                {
                  noOfPerson: {
                    [Op.gte]: noOfPerson,
                  },
                },
              ],
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
              status: {
                [Op.and]: [
                  { [Op.notLike]: BookingStatus.LEFT },
                  { [Op.notLike]: BookingStatus.CANCELLED },
                  { [Op.notLike]: BookingStatus.NOSHOW },
                ],
              },
              [Op.or]: [
                {
                  bookingStartTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
                {
                  bookingEndTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
              ],
            },
            required: false,
          },
          {
            model: OutletTableSectionDbModel,
            where: { isActive: true },
            required: false,
            duplicating: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TableSectionDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletGroupTableDbModel,
            where: { isActive: true },
            required: false,
            duplicating: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: [["Table", "noOfPerson", "ASC"]],
      });

      const bookingTable = outletTables.filter((outletTable) => {
        if (
          outletTable.OutletTableBooking &&
          outletTable.OutletTableBooking?.length === 0
        ) {
          return outletTable;
        }
        return null;
      });

      return bookingTable;
    } catch (error) {
      throw error;
    }
  };

  public deleteOutletTableBySeatTypeId = async (
    outletSeatTypeIds: number[]
  ): Promise<void> => {
    try {
      await this.repository.destroy({
        where: {
          outletSeatTypeId: {
            [Op.in]: outletSeatTypeIds,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  };

  public deleteOutletTableBySeatingTypeId = async (
    outletSeatingTypeIds: number[]
  ): Promise<void> => {
    try {
      await this.repository.destroy({
        where: {
          outletSeatingTypeId: {
            [Op.in]: outletSeatingTypeIds,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  };

  public checkTableBooking = async (
    requestStartTime: Date,
    requestEndTime: Date,
    id: number[]
  ): Promise<OutletTableDbModel[]> => {
    try {
      const outletTables = await this.repository.findAll({
        where: {
          id: {
            [Op.in]: id,
          },
          isActive: true,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
              status: {
                [Op.and]: [
                  { [Op.notLike]: BookingStatus.LEFT },
                  { [Op.notLike]: BookingStatus.CANCELLED },
                  { [Op.notLike]: BookingStatus.NOSHOW },
                ],
              },
              [Op.or]: [
                {
                  bookingStartTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
                {
                  bookingEndTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
              ],
            },
            required: true,
          },
        ],
      });

      return outletTables;
    } catch (error) {
      throw error;
    }
  };

  public getTablesForBooking = async (
    id: number[]
  ): Promise<OutletTableDbModel[]> => {
    const outletTables = await this.repository.findAll({
      where: { id, isActive: true },
    });

    return outletTables;
  };

  public getAllTables = async (
    requestStartTime: Date,
    requestEndTime: Date,
    outletId: number,
    noOfPerson: number
  ): Promise<OutletTableDbModel[]> => {
    try {
      const outletTables = await this.repository.findAll({
        where: {
          isActive: true,
          isPrivate: false,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
              [Op.and]: [
                {
                  noOfPerson: {
                    [Op.gte]: noOfPerson,
                  },
                },
              ],
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
              status: {
                [Op.and]: [
                  { [Op.notLike]: BookingStatus.LEFT },
                  { [Op.notLike]: BookingStatus.CANCELLED },
                  { [Op.notLike]: BookingStatus.NOSHOW },
                ],
              },
              [Op.or]: [
                {
                  bookingStartTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
                {
                  bookingEndTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
              ],
            },
            required: false,
          },
        ],
      });

      return outletTables;
    } catch (error) {
      throw error;
    }
  };

  public getAllTablesForSeatingView = async (
    outletSeatingTypeId: number,
    outletId: number,
    query: any
  ): Promise<OutletTableDbModel[]> => {
    try {
      if (isEmpty(query.mealType)) {
        delete query.mealType;
      }
      const outletTables = await this.repository.findAll({
        where: {
          isActive: true,
          outletSeatingTypeId,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
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
            },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletInvoiceDbModel,
                where: query,
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: CustomerDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
        order: ["id", ["OutletTableBooking", "bookingStartTime", "ASC"]],
      });

      return outletTables;
    } catch (error) {
      throw error;
    }
  };

  public getTableForSeatingView = async (
    id: number
  ): Promise<OutletTableDbModel | null> => {
    try {
      const outletTables = await this.repository.findOne({
        where: {
          id,
          isActive: true,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
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
            },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletInvoiceDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: CustomerDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
        order: [["OutletTableBooking", "bookingStartTime", "ASC"]],
      });

      return outletTables;
    } catch (error) {
      throw error;
    }
  };

  public getMoveTables = async (
    requestStartTime: Date,
    requestEndTime: Date,
    id: number[]
  ): Promise<OutletTableDbModel[]> => {
    try {
      const outletTables = await this.repository.findAll({
        where: {
          id: {
            [Op.in]: id,
          },
          isActive: true,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
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
                  bookingStartTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
                {
                  bookingEndTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
              ],
            },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletInvoiceDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: CustomerDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
        order: [["OutletTableBooking", "bookingStartTime", "ASC"]],
      });

      return outletTables;
    } catch (error) {
      throw error;
    }
  };

  public getAllTablesForListingView = async (
    outletSeatingTypeId: number,
    outletId: number,
    query: any
  ): Promise<OutletTableDbModel[]> => {
    try {
      const outletTables = await this.repository.findAll({
        where: {
          isActive: true,
          outletSeatingTypeId,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: query,
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletInvoiceDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: CustomerDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
        order: ["id", ["OutletTableBooking", "bookingStartTime", "ASC"]],
      });

      return outletTables;
    } catch (error) {
      throw error;
    }
  };

  public getTableForInvoice = async (
    id: number,
    requestStartTime: Date,
    requestEndTime: Date
  ): Promise<OutletTableDbModel | null> => {
    try {
      const outletTables = await this.repository.findOne({
        where: {
          id,
          isActive: true,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
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
              [Op.and]: [
                {
                  bookingStartTime: {
                    [Op.lte]: requestStartTime,
                  },
                },
                {
                  bookingEndTime: {
                    [Op.gte]: requestEndTime,
                  },
                },
              ],
            },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletInvoiceDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: CustomerDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
        order: [["OutletTableBooking", "bookingStartTime", "ASC"]],
      });

      return outletTables;
    } catch (error) {
      throw error;
    }
  };

  public checkTableAvaibilityForTicket = async (
    noOfPerson: number,
    outletId: number
  ): Promise<OutletTableDbModel | null> => {
    try {
      const check = await this.repository.findOne({
        where: {
          isPrivate: false,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletTableSectionDbModel,
            where: { isActive: true },
            required: true,
            duplicating: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TableSectionDbModel,
                where: { isActive: true, isPrivate: false },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
              noOfPerson: {
                [Op.gte]: noOfPerson,
              },
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return check;
    } catch (error) {
      throw error;
    }
  };

  public checkTableForTicketing = async (
    noOfPerson: number,
    outletId: number,
    requestStartTime: Date,
    requestEndTime: Date,
    outletSeatingTypeId?: number
  ): Promise<OutletTableDbModel[]> => {
    try {
      let query: any = { isActive: true, isPrivate: false };
      outletSeatingTypeId !== undefined &&
        (query.outletSeatingTypeId = outletSeatingTypeId);

      const outletTables = await this.repository.findAll({
        where: query,
        include: [
          {
            model: OutletTableSectionDbModel,
            where: { isActive: true },
            required: true,
            duplicating: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TableSectionDbModel,
                where: { isActive: true, isPrivate: false },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
              [Op.and]: [
                {
                  noOfPerson: {
                    [Op.gte]: noOfPerson,
                  },
                },
              ],
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
              status: {
                [Op.and]: [
                  { [Op.notLike]: BookingStatus.LEFT },
                  { [Op.notLike]: BookingStatus.CANCELLED },
                  { [Op.notLike]: BookingStatus.NOSHOW },
                ],
              },
              [Op.or]: [
                {
                  bookingStartTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
                {
                  bookingEndTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
              ],
            },
            required: false,
          },
        ],
        order: [["Table", "noOfPerson", "ASC"]],
      });

      const bookingTable = outletTables.filter((outletTable) => {
        if (
          outletTable.OutletTableBooking &&
          outletTable.OutletTableBooking?.length === 0
        ) {
          return outletTable;
        }
        return null;
      });

      return bookingTable;
    } catch (error) {
      throw error;
    }
  };

  public getAllTablesForTicketing = async (
    requestStartTime: Date,
    requestEndTime: Date,
    outletId: number
  ): Promise<OutletTableDbModel[]> => {
    try {
      const outletTables = await this.repository.findAll({
        where: {
          isActive: true,
          isPrivate: false,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletTableSectionDbModel,
            where: { isActive: true },
            required: true,
            duplicating: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TableSectionDbModel,
                where: { isActive: true, isPrivate: false },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
              status: {
                [Op.and]: [
                  { [Op.notLike]: BookingStatus.LEFT },
                  { [Op.notLike]: BookingStatus.CANCELLED },
                  { [Op.notLike]: BookingStatus.NOSHOW },
                ],
              },
              [Op.or]: [
                {
                  bookingStartTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
                {
                  bookingEndTime: {
                    [Op.between]: [requestStartTime, requestEndTime],
                  },
                },
              ],
            },
            required: false,
          },
        ],
      });

      return outletTables;
    } catch (error) {
      throw error;
    }
  };

  public getAllTablesForTimelineView = async (
    outletId: number,
    query: any
  ): Promise<OutletTableDbModel[]> => {
    try {
      if (isEmpty(query.mealType)) {
        delete query.mealType;
      }
      const outletTables = await this.repository.findAll({
        where: {
          isActive: true,
          isPrivate: false,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletSeatTypeDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatTypeDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: {
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            where: {
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
            },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletInvoiceDbModel,
                where: query,
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: CustomerDbModel,
                where: { isActive: true },
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
        order: [["OutletTableBooking", "bookingStartTime", "ASC"]],
      });

      return outletTables;
    } catch (error) {
      throw error;
    }
  };

  public getAllPrivateTableByOutletId = async (
    outletId: number
  ): Promise<OutletTableDbModel[]> => {
    try {
      const getAllOutletTable = await this.repository.findAll({
        where: {
          isActive: true,
          isPrivate: true,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: ["id"],
      });
      return getAllOutletTable;
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletTableByOutletId = async (
    outletId: number
  ): Promise<OutletTableDbModel[]> => {
    try {
      const getAllOutletTable = await this.repository.findAll({
        where: {
          isActive: true,
        },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            where: { outletId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: TableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: ["id"],
      });
      return getAllOutletTable;
    } catch (error) {
      throw error;
    }
  };
}
