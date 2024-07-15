import { Op, Sequelize, col, fn } from "sequelize";
import { BaseInterface } from "./baseDbInterface";
import { SeatingTypeDbModel, UserDbModel } from "../db/models";
import { SeatingType } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { Exceptions } from "../exception";

export class SeatingTypeDbInterface extends BaseInterface<SeatingTypeDbModel> {
  public constructor(sequelize: Sequelize) {
    super(SeatingTypeDbModel, sequelize);
  }

  public getAllSeatingType = async (
    id: number
  ): Promise<SeatingTypeDbModel[]> => {
    try {
      const seatingType = await this.repository.findAll({
        where: {
          outletId: {
            [Op.or]: [id, null],
          },
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
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: ["id"],
      });
      return seatingType;
    } catch (error) {
      throw error;
    }
  };

  //Create SeatingType
  public create = async (
    seatingType: SeatingType,
    userId: Number
  ): Promise<SeatingTypeDbModel> => {
    try {
      const createSeatingType = await this.repository.create({
        ...seatingType,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createSeatingType)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createSeatingType;
    } catch (error) {
      throw error;
    }
  };

  //GetSeatingType By Id And OutletId
  public getSeatingTypeByIdAndOultetId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<SeatingTypeDbModel> => {
    try {
      let query: any = { id, outletId };
      checkIsActive && (query.isActive = true);
      const seatingType = await this.repository.findOne({
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
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!seatingType) {
        throw new ApiError({
          message: Exceptions.INVALID_SEATINGTYPE,
          statusCode: StatusCode.NOTFOUND,
        });
      }
      return seatingType;
    } catch (error) {
      throw error;
    }
  };

  //Update SeatingType
  public updateSeatingType = async (
    seatingType: SeatingType,
    id: number,
    outletId: number,
    userId: number
  ): Promise<SeatingTypeDbModel> => {
    try {
      const updateSeatingType = await this.repository.update(
        { ...seatingType, updatedBy: userId },
        {
          where: {
            id,
            outletId,
          },
        }
      );

      if (updateSeatingType[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_SEATINGTYPE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getSeatingTypeByIdAndOultetId(id, outletId, false);
    } catch (error) {
      throw error;
    }
  };

  //Delete SeatingType
  public deleteSeatingType = async (
    id: number,
    outletId: number,
    userId: number
  ): Promise<SeatingTypeDbModel> => {
    try {
      const seatingType = await this.getSeatingTypeByIdAndOultetId(
        id,
        outletId,
        false
      );
      seatingType.updatedBy = userId;
      await seatingType.save();
      await seatingType.destroy();
      return seatingType;
    } catch (error) {
      throw error;
    }
  };
}
