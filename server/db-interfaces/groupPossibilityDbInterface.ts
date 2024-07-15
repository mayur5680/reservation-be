import { col, fn, Op, Sequelize } from "sequelize";
import { BookingStatus, ExcludeAttributes } from "../context";
import {
  GroupPossibilityDbModel,
  GroupTableDbModel,
  OutletSeatingTypeDbModel,
  OutletGroupTableDbModel,
  OutletTableDbModel,
  TableDbModel,
  OutletTableBookingDbModel,
  SeatingTypeDbModel,
  OutletSeatTypeDbModel,
  SeatTypeDbModel,
  OutletTableSectionDbModel,
  TableSectionDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { OutletGroupDbInterface } from "../db-interfaces";
import {
  BookingGroupPossibilities,
  checkPossibiltyPayload,
} from "../@types/outletTableBooking";

export class GroupPossibilityDbInterface extends BaseInterface<GroupPossibilityDbModel> {
  public constructor(sequelize: Sequelize) {
    super(GroupPossibilityDbModel, sequelize);
  }

  public create = async (
    groupTableId: number,
    index: number,
    userId: number
  ): Promise<GroupPossibilityDbModel> => {
    try {
      const createGroupPossibility = await this.repository.create({
        groupTableId,
        index,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createGroupPossibility)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createGroupPossibility;
    } catch (error) {
      throw error;
    }
  };

  //Get Group Possibitites By Id and GroupId
  public getGroupPossibilityById = async (
    id: number,
    groupTableId: number,
    checkIsActive = true
  ): Promise<GroupPossibilityDbModel> => {
    try {
      let query: any = { id, groupTableId };
      checkIsActive && (query.isActive = true);
      const groupPossibility = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: GroupTableDbModel,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!groupPossibility)
        throw new ApiError({
          message: Exceptions.INVALID_GROUP_POSSIBILITY,
          statusCode: StatusCode.NOTFOUND,
        });
      return groupPossibility;
    } catch (error) {
      throw error;
    }
  };

  //Get Group Possibitites By Id and GroupId
  public getGroupPossibilityBygroupId = async (
    groupTableId: number,
    checkIsActive = true
  ): Promise<GroupPossibilityDbModel[]> => {
    try {
      let query: any = { groupTableId };
      checkIsActive && (query.isActive = true);
      const groupPossibility = await this.repository.findAll({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: GroupTableDbModel,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!groupPossibility)
        throw new ApiError({
          message: Exceptions.INVALID_GROUP_POSSIBILITY,
          statusCode: StatusCode.NOTFOUND,
        });
      return groupPossibility;
    } catch (error) {
      throw error;
    }
  };

  public deleteGroupPossibility = async (
    id: number,
    groupTableId: number,
    outletGroupDbInterface: OutletGroupDbInterface,
    userId: number
  ): Promise<GroupPossibilityDbModel> => {
    try {
      const groupTablePossibility = await this.getGroupPossibilityById(
        id,
        groupTableId,
        false
      );
      await outletGroupDbInterface.deleteOutletGroupTable(
        groupTablePossibility.id
      );

      groupTablePossibility.updatedBy = userId;
      await groupTablePossibility.save();
      await groupTablePossibility.destroy();
      return groupTablePossibility;
    } catch (error) {
      throw error;
    }
  };

  public deleteGroupPossibilityByIds = async (
    ids: number[],
    outletGroupDbInterface: OutletGroupDbInterface
  ): Promise<void> => {
    try {
      //delete OutletGroupTable
      await outletGroupDbInterface.deleteOutletGroupTableByPossibilitesIds(ids);

      //delelte Possibility
      await this.repository.destroy({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  };

  public checkPossibilityTable = async (
    noOfPerson: number,
    outletId: number,
    requestStartTime: Date,
    requestEndTime: Date
  ): Promise<GroupPossibilityDbModel[]> => {
    try {
      let tablePossibility = await this.repository.findAll({
        attributes: [
          ["id", "possibilityId"],
          [
            fn("sum", col("OutletGroupTable.OutletTable.Table.noOfPerson")),
            "totalNoOfPerson",
          ],
          [
            fn(
              "count",
              col("OutletGroupTable.OutletTable.OutletTableBooking.id")
            ),
            "totalBookingCount",
          ],
        ],
        group: ["possibilityId"],
        having: Sequelize.where(
          fn("sum", col("OutletGroupTable.OutletTable.Table.noOfPerson")),
          {
            [Op.gte]: noOfPerson,
          }
        ),
        order: ["totalNoOfPerson"],
        include: [
          {
            model: GroupTableDbModel,
            as: "GroupTable",
            where: { isActive: true },
            required: true,
            attributes: [],
            include: [
              {
                model: OutletSeatingTypeDbModel,
                as: "OutletSeatingType",
                where: { outletId, isActive: true },
                required: true,
                attributes: [],
                include: [
                  {
                    model: SeatingTypeDbModel,
                    where: { isActive: true },
                    required: true,
                    attributes: [],
                  },
                ],
              },
            ],
          },
          {
            model: OutletGroupTableDbModel,
            as: "OutletGroupTable",
            where: { isActive: true },
            required: true,
            attributes: [],
            include: [
              {
                model: OutletTableDbModel,
                as: "OutletTable",
                where: { isActive: true, isPrivate: false },
                required: true,
                attributes: [],
                include: [
                  {
                    model: TableDbModel,
                    as: "Table",
                    required: true,
                    where: { isActive: true },
                    attributes: [],
                  },
                  {
                    model: OutletSeatTypeDbModel,
                    where: { isActive: true },
                    required: false,
                    attributes: [],
                    include: [
                      {
                        model: SeatTypeDbModel,
                        where: { isActive: true },
                        required: false,
                        attributes: [],
                      },
                    ],
                  },
                  {
                    model: OutletTableBookingDbModel,
                    as: "OutletTableBooking",
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
                    attributes: [],
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
        raw: true,
      });

      const possibilities =
        tablePossibility as unknown as BookingGroupPossibilities[];
      const findPossibilities = possibilities.filter(
        (possibility) =>
          possibility.totalBookingCount && possibility.totalBookingCount === "0"
      );

      if (findPossibilities.length > 0) {
        const possibilityIds = findPossibilities.map((possibility) => {
          return possibility.possibilityId;
        });
        let findAllPossibilityTable =
          await this.getGroupPossibilityByIdForBooking(possibilityIds);

        findAllPossibilityTable.sort(
          (a, b) => possibilityIds.indexOf(a.id) - possibilityIds.indexOf(b.id)
        );

        return findAllPossibilityTable;
      }

      throw new ApiError({
        message: Exceptions.BOOKING_TIMESLOTS_FULL,
        statusCode: StatusCode.BAD_REQUEST,
      });
    } catch (error) {
      throw error;
    }
  };

  public checkPossibilityTableForListingView = async (
    noOfPerson: number,
    outletId: number,
    requestStartTime: Date,
    requestEndTime: Date,
    outletSeatingTypeId: number
  ): Promise<GroupPossibilityDbModel[]> => {
    try {
      let tablePossibility = await this.repository.findAll({
        attributes: [
          ["id", "possibilityId"],
          [
            fn("sum", col("OutletGroupTable.OutletTable.Table.noOfPerson")),
            "totalNoOfPerson",
          ],
          [
            fn(
              "count",
              col("OutletGroupTable.OutletTable.OutletTableBooking.id")
            ),
            "totalBookingCount",
          ],
        ],
        group: ["possibilityId"],
        having: Sequelize.where(
          fn("sum", col("OutletGroupTable.OutletTable.Table.noOfPerson")),
          {
            [Op.gte]: noOfPerson,
          }
        ),
        order: ["totalNoOfPerson"],
        include: [
          {
            model: GroupTableDbModel,
            as: "GroupTable",
            where: { isActive: true, outletSeatingTypeId },
            required: true,
            attributes: [],
            include: [
              {
                model: OutletSeatingTypeDbModel,
                as: "OutletSeatingType",
                where: { outletId, isActive: true },
                required: true,
                attributes: [],
                include: [
                  {
                    model: SeatingTypeDbModel,
                    where: { isActive: true },
                    required: true,
                    attributes: [],
                  },
                ],
              },
            ],
          },
          {
            model: OutletGroupTableDbModel,
            as: "OutletGroupTable",
            where: { isActive: true },
            required: true,
            attributes: [],
            include: [
              {
                model: OutletTableDbModel,
                as: "OutletTable",
                where: { isActive: true, isPrivate: false },
                required: true,
                attributes: [],
                include: [
                  {
                    model: TableDbModel,
                    as: "Table",
                    required: true,
                    where: { isActive: true },
                    attributes: [],
                  },
                  {
                    model: OutletSeatTypeDbModel,
                    where: { isActive: true },
                    required: false,
                    attributes: [],
                    include: [
                      {
                        model: SeatTypeDbModel,
                        where: { isActive: true },
                        required: false,
                        attributes: [],
                      },
                    ],
                  },
                  {
                    model: OutletTableBookingDbModel,
                    as: "OutletTableBooking",
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
                    attributes: [],
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
        raw: true,
      });

      const possibilities =
        tablePossibility as unknown as BookingGroupPossibilities[];
      const findPossibilities = possibilities.filter(
        (possibility) =>
          possibility.totalBookingCount && possibility.totalBookingCount === "0"
      );

      if (findPossibilities.length > 0) {
        const possibilityIds = findPossibilities.map((possibility) => {
          return possibility.possibilityId;
        });
        const findAllPossibilityTable =
          await this.getGroupPossibilityByIdForBooking(possibilityIds);

        return findAllPossibilityTable;
      }

      throw new ApiError({
        message: Exceptions.BOOKING_TIMESLOTS_FULL,
        statusCode: StatusCode.BAD_REQUEST,
      });
    } catch (error) {
      throw error;
    }
  };

  public getGroupPossibilityByIdForBooking = async (
    id: number[]
  ): Promise<GroupPossibilityDbModel[]> => {
    try {
      const groupPossibility = await this.repository.findAll({
        where: {
          isActive: true,
          id,
        },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: GroupTableDbModel,
            where: { isActive: true },
            required: true,
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
            ],
          },
          {
            model: OutletGroupTableDbModel,
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletTableDbModel,
                where: { isActive: true, isPrivate: false },
                required: false,
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: TableDbModel,
                    required: true,
                    where: { isActive: true },
                    attributes: { exclude: ExcludeAttributes },
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
                ],
              },
            ],
          },
        ],
      });

      if (!groupPossibility)
        throw new ApiError({
          message: Exceptions.BOOKING_TIMESLOTS_FULL,
          statusCode: StatusCode.BAD_REQUEST,
        });
      return groupPossibility;
    } catch (error) {
      throw error;
    }
  };

  public checkTableAvaibility = async (
    noOfPerson: number,
    outletId: number
  ): Promise<boolean> => {
    try {
      let groupPossibility = await this.repository.findAll({
        attributes: [
          ["id", "possibilityId"],
          [
            fn("sum", col("OutletGroupTable.OutletTable.Table.noOfPerson")),
            "totalNoOfPerson",
          ],
        ],
        group: ["possibilityId"],
        having: Sequelize.where(
          fn("sum", col("OutletGroupTable.OutletTable.Table.noOfPerson")),
          {
            [Op.gte]: noOfPerson,
          }
        ),
        order: ["totalNoOfPerson"],
        include: [
          {
            model: GroupTableDbModel,
            as: "GroupTable",
            where: { isActive: true },
            required: true,
            attributes: [],
            include: [
              {
                model: OutletSeatingTypeDbModel,
                as: "OutletSeatingType",
                where: { outletId, isActive: true },
                required: true,
                attributes: [],
                include: [
                  {
                    model: SeatingTypeDbModel,
                    where: { isActive: true },
                    required: true,
                    attributes: [],
                  },
                ],
              },
            ],
          },
          {
            model: OutletGroupTableDbModel,
            as: "OutletGroupTable",
            where: { isActive: true },
            required: true,
            attributes: [],
            include: [
              {
                model: OutletTableDbModel,
                as: "OutletTable",
                where: { isPrivate: false, isActive: true },
                required: true,
                attributes: [],
                include: [
                  {
                    model: TableDbModel,
                    as: "Table",
                    required: true,
                    where: { isActive: true },
                    attributes: [],
                  },
                  {
                    model: OutletSeatTypeDbModel,
                    where: { isActive: true },
                    required: false,
                    attributes: [],
                    include: [
                      {
                        model: SeatTypeDbModel,
                        where: { isActive: true },
                        required: false,
                        attributes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (groupPossibility.length === 0) {
        return false;
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  public checkPossibilityExists = async (
    groupTableId: number,
    outletTable: number[]
  ): Promise<void> => {
    try {
      const possibilitity = await this.repository.findAll({
        where: {
          groupTableId,
        },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletGroupTableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      const checkPossibilty: checkPossibiltyPayload[] = [];

      possibilitity.map((singlePossibility) => {
        if (singlePossibility.OutletGroupTable)
          checkPossibilty.push({
            id: singlePossibility.id,
            outletTableIds: singlePossibility.OutletGroupTable.map(
              (outletGroup) => {
                return outletGroup.outletTableId;
              }
            ),
          });
      });

      checkPossibilty.map((singlePossibility) => {
        const isExistPossibility = outletTable.every((elem: any) =>
          singlePossibility.outletTableIds.includes(elem)
        );
        if (
          isExistPossibility &&
          outletTable.length === singlePossibility.outletTableIds.length
        ) {
          throw new ApiError({
            message: Exceptions.POSSIBILITY_ALREADY_EXISTS,
            statusCode: StatusCode.BAD_REQUEST,
          });
        }
      });
    } catch (error) {
      throw error;
    }
  };

  public checkPossibilityTableForTicketing = async (
    noOfPerson: number,
    outletId: number,
    requestStartTime: Date,
    requestEndTime: Date
  ): Promise<GroupPossibilityDbModel[]> => {
    try {
      let tablePossibility = await this.repository.findAll({
        attributes: [
          ["id", "possibilityId"],
          [
            fn("sum", col("OutletGroupTable.OutletTable.Table.noOfPerson")),
            "totalNoOfPerson",
          ],
          [
            fn(
              "count",
              col("OutletGroupTable.OutletTable.OutletTableBooking.id")
            ),
            "totalBookingCount",
          ],
        ],
        group: ["possibilityId"],
        having: Sequelize.where(
          fn("sum", col("OutletGroupTable.OutletTable.Table.noOfPerson")),
          {
            [Op.gte]: noOfPerson,
          }
        ),
        order: ["totalNoOfPerson"],
        include: [
          {
            model: GroupTableDbModel,
            as: "GroupTable",
            where: { isActive: true },
            required: true,
            attributes: [],
            include: [
              {
                model: OutletSeatingTypeDbModel,
                as: "OutletSeatingType",
                where: { outletId, isActive: true },
                required: true,
                attributes: [],
                include: [
                  {
                    model: SeatingTypeDbModel,
                    where: { isActive: true },
                    required: true,
                    attributes: [],
                  },
                ],
              },
            ],
          },
          {
            model: OutletGroupTableDbModel,
            as: "OutletGroupTable",
            where: { isActive: true },
            required: true,
            attributes: [],
            include: [
              {
                model: OutletTableDbModel,
                as: "OutletTable",
                where: { isActive: true, isPrivate: false },
                required: true,
                attributes: [],
                include: [
                  {
                    model: TableDbModel,
                    as: "Table",
                    required: true,
                    where: { isActive: true },
                    attributes: [],
                  },
                  {
                    model: OutletTableSectionDbModel,
                    as: "OutletTableSection",
                    where: { isActive: true },
                    required: true,
                    attributes: [],
                    include: [
                      {
                        model: TableSectionDbModel,
                        as: "TableSection",
                        where: { isActive: true, isPrivate: false },
                        required: true,
                        attributes: [],
                      },
                    ],
                  },
                  {
                    model: OutletSeatTypeDbModel,
                    where: { isActive: true },
                    required: false,
                    attributes: [],
                    include: [
                      {
                        model: SeatTypeDbModel,
                        where: { isActive: true },
                        required: false,
                        attributes: [],
                      },
                    ],
                  },
                  {
                    model: OutletTableBookingDbModel,
                    as: "OutletTableBooking",
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
                    attributes: [],
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
        raw: true,
      });

      const possibilities =
        tablePossibility as unknown as BookingGroupPossibilities[];
      const findPossibilities = possibilities.filter(
        (possibility) =>
          possibility.totalBookingCount && possibility.totalBookingCount === "0"
      );

      if (findPossibilities.length > 0) {
        const possibilityIds = findPossibilities.map((possibility) => {
          return possibility.possibilityId;
        });
        const findAllPossibilityTable =
          await this.getGroupPossibilityByIdForBooking(possibilityIds);

        return findAllPossibilityTable;
      }

      throw new ApiError({
        message: Exceptions.BOOKING_TIMESLOTS_FULL,
        statusCode: StatusCode.BAD_REQUEST,
      });
    } catch (error) {
      throw error;
    }
  };

  public checkPossibilityTableForTicketTimeSlot = async (
    outletId: number,
    requestStartTime: Date,
    requestEndTime: Date
  ): Promise<GroupPossibilityDbModel[] | null> => {
    try {
      let tablePossibility = await this.repository.findAll({
        where: { isActive: true },
        include: [
          {
            model: GroupTableDbModel,
            as: "GroupTable",
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletSeatingTypeDbModel,
                as: "OutletSeatingType",
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
            ],
          },
          {
            model: OutletTableDbModel,
            as: "OutletTable",
            where: { isActive: true, isPrivate: false },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletTableSectionDbModel,
                as: "OutletTableSection",
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: TableSectionDbModel,
                    as: "TableSection",
                    where: { isActive: true, isPrivate: false },
                    required: true,
                    attributes: { exclude: ExcludeAttributes },
                  },
                ],
              },
              {
                model: TableDbModel,
                as: "Table",
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
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
                model: OutletTableBookingDbModel,
                as: "OutletTableBooking",
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
                attributes: { exclude: ExcludeAttributes },
                required: true,
              },
            ],
          },
        ],
      });

      return tablePossibility;
    } catch (error) {
      throw error;
    }
  };

  public checkPossibilityTableForTimeSlot = async (
    outletId: number,
    requestStartTime: Date,
    requestEndTime: Date,
    noOfPerson: number
  ): Promise<GroupPossibilityDbModel[] | null> => {
    try {
      let tablePossibility = await this.repository.findAll({
        where: { isActive: true },
        include: [
          {
            model: GroupTableDbModel,
            as: "GroupTable",
            where: {
              isActive: true,
              [Op.and]: [
                {
                  minPax: {
                    [Op.lte]: noOfPerson,
                  },
                  maxPax: {
                    [Op.gte]: noOfPerson,
                  },
                },
              ],
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletSeatingTypeDbModel,
                as: "OutletSeatingType",
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
            ],
          },
          {
            model: OutletTableDbModel,
            as: "OutletTable",
            where: { isActive: true, isPrivate: false },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TableDbModel,
                as: "Table",
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
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
                model: OutletTableBookingDbModel,
                as: "OutletTableBooking",
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
                attributes: { exclude: ExcludeAttributes },
                required: false,
              },
            ],
          },
        ],
      });

      return tablePossibility;
    } catch (error) {
      throw error;
    }
  };
}
