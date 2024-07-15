import { Sequelize, col, fn } from "sequelize";
import { Coupon } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { CouponDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class CouponDbInterface extends BaseInterface<CouponDbModel> {
  public constructor(sequelize: Sequelize) {
    super(CouponDbModel, sequelize);
  }

  public create = async (
    coupon: Coupon,
    userId: number
  ): Promise<CouponDbModel> => {
    try {
      const createCoupon = await this.repository.create({
        ...coupon,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createCoupon)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createCoupon;
    } catch (error) {
      throw error;
    }
  };

  public getAllCouponByOutletId = async (query: any): Promise<Coupon[]> => {
    try {
      const coupon = await this.repository.findAll({
        where: query,
        order: [["startDate", "ASC"]],
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
        raw: true,
        include: [
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });

      return coupon;
    } catch (error) {
      throw error;
    }
  };

  //Get Raw Data Coupon By Id
  public getRawCouponById = async (id: number): Promise<CouponDbModel> => {
    try {
      const coupon = await this.repository.findOne({
        where: {
          id,
        },
        raw: true,
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
      if (!coupon)
        throw new ApiError({
          message: Exceptions.INVALID_COUPON,
          statusCode: StatusCode.NOTFOUND,
        });
      return coupon;
    } catch (error) {
      throw error;
    }
  };

  //Get Coupon By Id Without Raw
  public getCouponById = async (id: number): Promise<CouponDbModel> => {
    try {
      const coupon = await this.repository.findOne({
        where: {
          id,
        },
        attributes: { exclude: ExcludeAttributes },
      });
      if (!coupon)
        throw new ApiError({
          message: Exceptions.INVALID_COUPON,
          statusCode: StatusCode.NOTFOUND,
        });
      return coupon;
    } catch (error) {
      throw error;
    }
  };

  public updateCoupon = async (
    id: number,
    coupon: Coupon,
    userId: number
  ): Promise<CouponDbModel> => {
    try {
      const updateCoupon = await this.repository.update(
        { ...coupon, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateCoupon[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_COUPON,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getRawCouponById(id);
    } catch (error) {
      throw error;
    }
  };

  public deleteCoupon = async (
    id: number,
    userId: number
  ): Promise<CouponDbModel> => {
    try {
      const coupon = await this.getCouponById(id);
      coupon.updatedBy = userId;
      await coupon.save();
      await coupon.destroy();
      return coupon;
    } catch (error) {
      throw error;
    }
  };

  public getCouponForBooking = async (
    query: any
  ): Promise<CouponDbModel | null> => {
    try {
      const coupon = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
      });
      return coupon;
    } catch (error) {
      throw error;
    }
  };

  public getCouponForTimeSlot = async (
    query: any
  ): Promise<CouponDbModel[]> => {
    try {
      const coupon = await this.repository.findAll({
        where: query,
        attributes: { exclude: ExcludeAttributes },
      });
      return coupon;
    } catch (error) {
      throw error;
    }
  };
}
