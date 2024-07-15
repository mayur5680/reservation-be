import { Op, Sequelize, col, fn } from "sequelize";
import { TableSection } from "../db/interface";
import { BookingStatus, ExcludeAttributes } from "../context";
import {
  TableSectionDbModel,
  OutletSeatingTypeDbModel,
  SeatingTypeDbModel,
  OutletTableSectionDbModel,
  OutletTableDbModel,
  TableDbModel,
  UserDbModel,
  OutletTableBookingDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { OutletTablseSectionDbInterface } from "./outletTableSectionDbInterface";

export class TableSectionDbInterface extends BaseInterface<TableSectionDbModel> {
  public constructor(sequelize: Sequelize) {
    super(TableSectionDbModel, sequelize);
  }

  //Create TableSection
  public create = async (
    tableSection: TableSection,
    userId: number
  ): Promise<TableSectionDbModel> => {
    try {
      const createTableSection = await this.repository.create({
        ...tableSection,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createTableSection)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createTableSection;
    } catch (error) {
      throw error;
    }
  };

  //GetAll TableSection by OutletSeatingType
  public getAllTableSection = async (
    id: number
  ): Promise<TableSectionDbModel[]> => {
    try {
      const getAllTableSection = await this.repository.findAll({
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
            model: OutletTableSectionDbModel,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletTableDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: TableDbModel,
                    where: { isActive: true },
                    required: true,
                    attributes: { exclude: ExcludeAttributes },
                  },
                ],
              },
            ],
          },
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
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: ["id"],
      });
      return getAllTableSection;
    } catch (error) {
      throw error;
    }
  };

  //Get TableSection by Id
  public getTablSectioneById = async (
    id: number,
    checkIsActive = true
  ): Promise<TableSectionDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const tableSection = await this.repository.findOne({
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
            model: OutletTableSectionDbModel,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletTableDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: TableDbModel,
                    where: { isActive: true },
                    required: true,
                    attributes: { exclude: ExcludeAttributes },
                  },
                ],
              },
            ],
          },
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
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!tableSection)
        throw new ApiError({
          message: Exceptions.INVALID_SECTION,
          statusCode: StatusCode.NOTFOUND,
        });
      return tableSection;
    } catch (error) {
      throw error;
    }
  };

  //Update TableSection By Id
  public updateTableSection = async (
    id: number,
    tableSection: TableSection,
    userId: number
  ): Promise<TableSectionDbModel> => {
    try {
      const updateTableSection = await this.repository.update(
        { ...tableSection, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateTableSection[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_SECTION,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getTablSectioneById(id, false);
    } catch (error) {
      throw error;
    }
  };

  //Delete TableSection By Id
  public deleteTableSection = async (
    id: number,
    outletTablseSectionDbInterface: OutletTablseSectionDbInterface,
    userId: number
  ): Promise<TableSectionDbModel> => {
    try {
      const tableSection = await this.getTablSectioneById(id, false);
      await outletTablseSectionDbInterface.deleteOutletGroupTable(
        tableSection.id
      );
      tableSection.updatedBy = userId;
      await tableSection.save();
      await tableSection.destroy();
      return tableSection;
    } catch (error) {
      throw error;
    }
  };

  //Check section for private event
  public checkTableSectionAvailibilty = async (
    noOfPerson: number,
    outletId: number
  ): Promise<boolean> => {
    try {
      const getAllTableSection = await this.repository.findAll({
        where: {
          maxPax: {
            [Op.gte]: noOfPerson,
          },
        },
        include: [
          {
            model: OutletTableSectionDbModel,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletTableDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: TableDbModel,
                    where: { isActive: true },
                    required: true,
                    attributes: { exclude: ExcludeAttributes },
                  },
                ],
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
        ],
      });
      if (getAllTableSection.length === 0) {
        return false;
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  //Check section for private room
  public checkPrivateSectionAvailibilty = async (
    outletId: number,
    requestStartTime: Date,
    requestEndTime: Date,
    noOfPerson: number
  ): Promise<TableSectionDbModel[]> => {
    try {
      const getAllTableSection = await this.repository.findAll({
        where: {
          isActive: true,
          isPrivate: true,
          maxPax: {
            [Op.gte]: noOfPerson,
          },
        },
        include: [
          {
            model: OutletTableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TableDbModel,
                where: { isActive: true },
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
        ],
      });

      return getAllTableSection;
    } catch (error) {
      throw error;
    }
  };

  //GetAll TableSection by OutletSeatingType
  public getAllPrivateTableSection = async (
    outletId: number
  ): Promise<TableSectionDbModel[]> => {
    try {
      const getAllTableSection = await this.repository.findAll({
        where: {
          outletId,
          isPrivate: true,
        },
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
            model: OutletTableSectionDbModel,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletTableDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: TableDbModel,
                    where: { isActive: true },
                    required: true,
                    attributes: { exclude: ExcludeAttributes },
                  },
                ],
              },
            ],
          },
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
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: ["id"],
      });
      return getAllTableSection;
    } catch (error) {
      throw error;
    }
  };
}
