import { Op, Sequelize, col, fn } from "sequelize";
import { Outlet } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  OutletDbModel,
  OutletTimeSlotDbModel,
  OutletTimeSlotOverrideDbModel,
  OutletSeatingTypeDbModel,
  OutletTableDbModel,
  GroupTableDbModel,
  GroupPossibilityDbModel,
  SectionDbModel,
  CompanyDbModel,
  TableDbModel,
  SeatingTypeDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import moment from "moment";

export class OutletDbInterface extends BaseInterface<OutletDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletDbModel, sequelize);
  }

  public getOutletbyId = async (
    id: number,
    checkIsActive = true
  ): Promise<OutletDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const outlet = await this.repository.findOne({
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
            model: CompanyDbModel,
            where: { isActive: true },
            required: false,
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

      if (!outlet)
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET,
          statusCode: StatusCode.NOTFOUND,
        });
      return outlet;
    } catch (error) {
      throw error;
    }
  };

  public getAllOutlets = async (): Promise<OutletDbModel[]> => {
    try {
      const outlets = await this.repository.findAll({
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
            model: CompanyDbModel,
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
      return outlets;
    } catch (error) {
      throw error;
    }
  };

  //Get All Outltes For Customer
  public getAllOutletsForCustomer = async (): Promise<OutletDbModel[]> => {
    try {
      const outlets = await this.repository.findAll({
        where: { isActive: true },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletTimeSlotDbModel,
            required: true,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTimeSlotOverrideDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: ["id"],
      });
      return outlets;
    } catch (error) {
      throw error;
    }
  };

  //Get Outlte By Id For Customer
  public getOutletByIdForCustomer = async (
    id: number,
    dayofweek: number
  ): Promise<OutletDbModel> => {
    try {
      const outlet = await this.repository.findOne({
        where: { id, isActive: true },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletTimeSlotDbModel,
            required: false,
            where: { isActive: true, dayofweek },
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SectionDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletTimeSlotOverrideDbModel,
            where: {
              isActive: true,
              dayofweek,
            },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SectionDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });
      if (!outlet)
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET,
          statusCode: StatusCode.NOTFOUND,
        });
      return outlet;
    } catch (error) {
      throw error;
    }
  };

  public createOutlet = async (
    outlet: Outlet,
    userId: number
  ): Promise<OutletDbModel> => {
    try {
      const createOutlet = await this.repository.create({
        ...outlet,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createOutlet)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createOutlet;
    } catch (error) {
      throw error;
    }
  };

  public deleteOutlet = async (
    id: number,
    userId: number
  ): Promise<OutletDbModel> => {
    try {
      const deleteOutlet = await this.getOutletbyId(id, false);
      deleteOutlet.updatedBy = userId;
      await deleteOutlet.save();
      await deleteOutlet.destroy();

      return deleteOutlet;
    } catch (error) {
      throw error;
    }
  };

  public updateOutlet = async (
    outlet: Outlet,
    id: number,
    userId: number
  ): Promise<OutletDbModel> => {
    try {
      const updateOutlet = await this.repository.update(
        { ...outlet, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateOutlet[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getOutletbyId(id, false);
    } catch (error) {
      throw error;
    }
  };

  //Get All Outltes For Customer
  public checkTable = async (
    id: number,
    noOfPerson: number,
    requestDate: Date
  ): Promise<OutletDbModel> => {
    try {
      const outlet = await this.repository.findOne({
        where: { id, isActive: true },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            required: true,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletTableDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: GroupTableDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: GroupPossibilityDbModel,
                    required: true,
                    where: { isActive: true },
                    attributes: { exclude: ExcludeAttributes },
                  },
                ],
              },
            ],
          },
        ],
      });
      if (!outlet)
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET,
          statusCode: StatusCode.NOTFOUND,
        });
      return outlet;
    } catch (error) {
      throw error;
    }
  };

  //Get Outlte By Id For Customer
  public getOutletByIdForMealType = async (
    id: number,
    dayofweek: number
  ): Promise<OutletDbModel | null> => {
    try {
      const outlet = await this.repository.findOne({
        where: { id, isActive: true },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletTimeSlotDbModel,
            required: true,
            where: { isActive: true, dayofweek },
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SectionDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletTimeSlotOverrideDbModel,
            where: {
              isActive: true,
              dayofweek,
            },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SectionDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });

      return outlet;
    } catch (error) {
      throw error;
    }
  };

  //Get All Outltes For Customer
  public getOutletsForTimeSlot = async (id: number): Promise<OutletDbModel> => {
    try {
      const outlet = await this.repository.findOne({
        where: { id, isActive: true },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletTimeSlotDbModel,
            required: false,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SectionDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletTimeSlotOverrideDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SectionDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });
      if (!outlet) {
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET,
          statusCode: StatusCode.NOTFOUND,
        });
      }
      return outlet;
    } catch (error) {
      throw error;
    }
  };

  //Get Outler Name by Ivrs Phone No
  public getOutletIvrsPhoneNo = async (
    ivrsPhoneNo: string
  ): Promise<OutletDbModel | null> => {
    try {
      const outlet = await this.repository.findOne({
        where: { ivrsPhoneNo },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: CompanyDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      return outlet;
    } catch (error) {
      throw error;
    }
  };

  //Get Outler Name by Ivrs Phone No by Company Id
  public getOutletIvrsPhoneNoByCompanyId = async (
    ivrsPhoneNo: string,
    companyId: number
  ): Promise<Boolean> => {
    try {
      const outlet = await this.repository.findOne({
        where: { ivrsPhoneNo, companyId },
        attributes: { exclude: ExcludeAttributes },
      });
      if (outlet) {
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  };

  public getOutletsByCompanyId = async (
    companyId: number
  ): Promise<OutletDbModel[]> => {
    try {
      const outlets = await this.repository.findAll({
        where: { isActive: true, companyId },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletSeatingTypeDbModel,
            required: true,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: OutletTableDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: TableDbModel,
                    required: true,
                    where: { isActive: true },
                    attributes: { exclude: ExcludeAttributes },
                  },
                ],
              },
              {
                model: GroupTableDbModel,
                required: false,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: GroupPossibilityDbModel,
                    where: { isActive: true },
                    required: true,
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
                ],
              },
            ],
          },
        ],
      });
      return outlets;
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletsByCompanyId = async (
    companyId: number
  ): Promise<OutletDbModel[]> => {
    try {
      const outlets = await this.repository.findAll({
        where: {
          companyId,
        },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: CompanyDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: ["id"],
      });
      return outlets;
    } catch (error) {
      throw error;
    }
  };

  public getOutletbyChopeName = async (
    vendorName: string
  ): Promise<OutletDbModel> => {
    try {
      const outlet = await this.repository.findOne({
        where: {
          [Op.or]: [
            {
              chopeName: vendorName,
            },
            {
              oddleName: vendorName,
            },
          ],
        },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: CompanyDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      if (!outlet)
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET,
          statusCode: StatusCode.NOTFOUND,
        });
      return outlet;
    } catch (error) {
      throw error;
    }
  };
}
