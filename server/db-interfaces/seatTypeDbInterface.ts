import { Op, Sequelize, col, fn } from "sequelize";
import { BaseInterface } from "./baseDbInterface";
import { SeatTypeDbModel, UserDbModel } from "../db/models";
import { SeatType } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { Exceptions } from "../exception";

export class SeatTypeDbInterface extends BaseInterface<SeatTypeDbModel> {
  public constructor(sequelize: Sequelize) {
    super(SeatTypeDbModel, sequelize);
  }

  public getAllSeatType = async (id: number): Promise<SeatTypeDbModel[]> => {
    try {
      const seatType = await this.repository.findAll({
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
      return seatType;
    } catch (error) {
      throw error;
    }
  };

  //Create SeatType
  public create = async (
    seatType: SeatType,
    userId: Number
  ): Promise<SeatTypeDbModel> => {
    try {
      const createSeatType = await this.repository.create({
        ...seatType,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createSeatType)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createSeatType;
    } catch (error) {
      throw error;
    }
  };

  //GetSeatType By Id And OutletId
  public getSeatTypeByIdAndOultetId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<SeatTypeDbModel> => {
    try {
      let query: any = { id, outletId };
      checkIsActive && (query.isActive = true);
      const seatType = await this.repository.findOne({
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
      if (!seatType) {
        throw new ApiError({
          message: Exceptions.INVALID_SEATTYPE,
          statusCode: StatusCode.NOTFOUND,
        });
      }
      return seatType;
    } catch (error) {
      throw error;
    }
  };

  //Update SeatType
  public updateSeatType = async (
    seatType: SeatType,
    id: number,
    outletId: number,
    userId: number
  ): Promise<SeatTypeDbModel> => {
    try {
      const updateSeatType = await this.repository.update(
        { ...seatType, updatedBy: userId },
        {
          where: {
            id,
            outletId,
          },
        }
      );

      if (updateSeatType[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_SEATTYPE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getSeatTypeByIdAndOultetId(id, outletId, false);
    } catch (error) {
      throw error;
    }
  };

  //Delete SeatType
  public deleteSeatType = async (
    id: number,
    outletId: number,
    userId: number
  ): Promise<SeatTypeDbModel> => {
    try {
      const seatType = await this.getSeatTypeByIdAndOultetId(
        id,
        outletId,
        false
      );
      seatType.updatedBy = userId;
      await seatType.save();
      await seatType.destroy();
      return seatType;
    } catch (error) {
      throw error;
    }
  };
}
