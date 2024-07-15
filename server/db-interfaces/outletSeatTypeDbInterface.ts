import { Op, Sequelize } from "sequelize";
import { BaseInterface } from "./baseDbInterface";
import { ExcludeAttributes } from "../context";
import { Exceptions } from "../exception";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { CreateOutletBasicInfoPayload } from "../@types/outletInformation";
import { OutletSeatType } from "../db/interface";
import { OutletSeatTypeDbModel, SeatTypeDbModel } from "../db/models";
import { OutletTableDbInterface } from "./";

export class OutletSeatTypeDbInterface extends BaseInterface<OutletSeatTypeDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletSeatTypeDbModel, sequelize);
  }

  public create = async (
    seatType: number[],
    outletId: number,
    userId: number
  ): Promise<OutletSeatTypeDbModel[]> => {
    try {
      let outletSeatTypes: OutletSeatType[] = [];

      seatType.map((seatType) => {
        const outletSeatType: OutletSeatType = {
          seatTypeId: seatType,
          outletId: outletId,
          createdBy: userId,
          updatedBy: userId,
          deletedAt: undefined,
        };
        outletSeatTypes.push(outletSeatType);
      });

      const createOutletSeating = await this.repository.bulkCreate(
        outletSeatTypes as any,
        {
          updateOnDuplicate: ["updatedBy", "deletedAt"],
        }
      );

      if (!createOutletSeating)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return this.getAllOutletSeatType(outletId);
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletSeatType = async (
    id: number
  ): Promise<OutletSeatTypeDbModel[]> => {
    try {
      const getAllOutletSeatType = await this.repository.findAll({
        where: {
          outletId: id,
        },
        include: [
          {
            model: SeatTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: ["seatTypeId"],
      });
      return getAllOutletSeatType;
    } catch (error) {
      throw error;
    }
  };

  public deleteOutletSeatType = async (
    ids: number[],
    outletTableDbInterface: OutletTableDbInterface
  ): Promise<void> => {
    try {
      //Delete OutletTable
      //await outletTableDbInterface.deleteOutletTableBySeatTypeId(ids);

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

  public getOutletSeatById = async (
    id: number,
    checkIsActive = true
  ): Promise<OutletSeatTypeDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const outletSeatType = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: SeatTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!outletSeatType)
        throw new ApiError({
          message: Exceptions.INVALID_SEATTYPE,
          statusCode: StatusCode.NOTFOUND,
        });
      return outletSeatType;
    } catch (error) {
      throw error;
    }
  };
}
