import { Sequelize, col, fn } from "sequelize";
import { generate } from "generate-password";
import { LoginRequest, ResetPasswordRequest } from "server/@types/auth";
import { EmailActionType, ExcludeAttributes, StatusCode } from "../context";
import {
  CompanyDbModel,
  OutletDbModel,
  OutletUserDbModel,
  RoleDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { ApiError } from "../@types/apiError";
import {
  CreateUserPayload,
  CreateSuperAdminPayload,
  UpdateUserPayload,
} from "../@types/user";
import { OutletUserDbInterface } from "./";
import { sendMail } from "../context/service";

export class UserDbInterface extends BaseInterface<UserDbModel> {
  public constructor(sequelize: Sequelize) {
    super(UserDbModel, sequelize);
  }

  // Get user outlets by id
  public getUserOutLetsById = async (id: number): Promise<UserDbModel> => {
    try {
      const user = await this.repository.findOne({
        where: {
          id,
          isActive: true,
        },
        include: [
          {
            model: OutletUserDbModel,
            attributes: { exclude: ExcludeAttributes },
            where: {
              isActive: true,
            },
            required: true,
            include: [
              {
                model: OutletDbModel,
                where: {
                  isActive: true,
                },
                attributes: { exclude: ExcludeAttributes },
                required: true,
                include: [
                  {
                    model: CompanyDbModel,
                    where: { isActive: true },
                    required: false,
                    attributes: { exclude: ExcludeAttributes },
                  },
                ],
              },
              {
                model: RoleDbModel,
                where: {
                  isActive: true,
                },
                attributes: { exclude: ExcludeAttributes },
                required: true,
              },
            ],
          },
        ],
        attributes: { exclude: ExcludeAttributes },
      });

      // check if user is availalbe and not null
      if (!user)
        throw new ApiError({
          message: Exceptions.UNAUTHORIZED_ACCESS,
          statusCode: StatusCode.UNAUTHORIZED,
        });

      return user;
    } catch (error) {
      throw error;
    }
  };

  public checkUserById = async (
    id: number,
    checkIsActive = true
  ): Promise<UserDbModel> => {
    try {
      let query: any = {};
      checkIsActive && (query.isActive = true);
      const user = await this.repository.findOne({
        where: {
          ...query,
          id,
        },
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
            required: false,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!user)
        throw new ApiError({
          message: Exceptions.INVALID_USER,
          statusCode: StatusCode.UNAUTHORIZED,
        });

      return user;
    } catch (error) {
      throw error;
    }
  };

  public getUserByUserIdAndOutletId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<UserDbModel> => {
    try {
      let query: any = {};
      checkIsActive && (query.isActive = true);
      const user = await this.repository.findOne({
        where: {
          ...query,
          id,
        },
        include: [
          {
            model: OutletUserDbModel,
            where: { ...query, outletId },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletDbModel,
                where: query,
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: RoleDbModel,
                where: query,
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: UserDbModel,
            required: false,
            where: { isActive: true },
            attributes: [],
          },
        ],
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
      });
      // check if user is availalbe and not null
      if (!user)
        throw new ApiError({
          message: Exceptions.UNAUTHORIZED_ACCESS,
          statusCode: StatusCode.UNAUTHORIZED,
        });
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Get user outlets by userName
  public getUserOutLetsByUserName = async (
    userName: string,
    checkIsActive = true
  ): Promise<UserDbModel | null> => {
    try {
      let query: any = {};
      checkIsActive && (query.isActive = true);
      const user = await this.repository.findOne({
        where: {
          userName,
        },
        include: [
          {
            model: OutletUserDbModel,
            where: query,
            required: false,
            include: [
              {
                model: OutletDbModel,
                where: query,
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: RoleDbModel,
                where: query,
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return user;
    } catch (error) {
      throw error;
    }
  };

  //Get User by username and password
  public getLoggedInUser = async (
    loginRequest: LoginRequest
  ): Promise<UserDbModel> => {
    try {
      let user = await this.repository.findOne({
        where: {
          userName: loginRequest.userName,
          password: loginRequest.password,
          isActive: true,
        },
        attributes: { exclude: ExcludeAttributes },
      });

      if (!user) {
        throw new ApiError({
          message: Exceptions.INVALID_USERNAME_PASSWORD,
          statusCode: StatusCode.UNAUTHORIZED,
        });
      }

      if (user.roleId) {
        return user;
      }

      user = await this.getUserOutLetsById(user.id);

      return user;
    } catch (error) {
      throw error;
    }
  };

  public createUser = async (
    userPayload: CreateUserPayload,
    outletUserDbInterface: OutletUserDbInterface,
    outletDbmodel: OutletDbModel,
    userId: number,
    uniqueId: string
  ): Promise<UserDbModel> => {
    try {
      let user = await this.getUserOutLetsByUserName(userPayload.email, false);

      //check if user is exist or not
      if (user) {
        //Super Admin
        if (user.roleId) {
          throw new ApiError({
            message: Exceptions.ALREADY_USER_PERMISSION,
            statusCode: StatusCode.BAD_REQUEST,
          });
        } else {
          if (
            user.OutletUser &&
            user.OutletUser.find(
              (outlet) =>
                outlet.outletId === userPayload.outletId && outlet.Role
            )
          ) {
            //user is already available for this outlet
            throw new ApiError({
              message: Exceptions.ALREADY_USER_PERMISSION,
              statusCode: StatusCode.BAD_REQUEST,
            });
          } else {
            //useroutlet entry
            await outletUserDbInterface.create({
              ...userPayload,
              userId: user.id,
            });

            //send Mail
            let html = `<html><body><table cellpadding="10" style="max-width:600pt;background-color:#b6d0e7;font-family:Arial,Helvetica,Sans-Serif;font-size:11pt"><tr><td colspan="2">Dear ${user.userName}</p></td></tr><tr><td width="20pt"></td><td style="background-color:#fff"><p>You Got New Permission for ${outletDbmodel.name}.<br><vr></vr><b>Please use your existing Username and Password</b><p></td></tr></table></body></html>`;

            this.repository.sequelize &&
              (await sendMail(
                user.email,
                html,
                this.repository.sequelize,
                uniqueId,
                EmailActionType.USER_CREATION,
                outletDbmodel,
                "CreatE: User Access"
              ));
          }
        }
      } else {
        //create User and crete UserOutlet
        const password = generate({
          length: 10,
          numbers: true,
        });
        user = await this.repository.create({
          userName: userPayload.email,
          email: userPayload.email,
          password: password,
          createdBy: userId,
          updatedBy: userId,
        });
        await outletUserDbInterface.create({
          ...userPayload,
          userId: user.id,
        });

        //send Mail
        let html = `<html><body><table cellpadding="10" style="max-width:600pt;background-color:#b6d0e7;font-family:Arial,Helvetica,Sans-Serif;font-size:11pt"><tr><td colspan="2">Dear ${user.userName}</p></td></tr><tr><td width="20pt"></td><td style="background-color:#fff"><p>Your CreatE Account is created. Please start your CreatE Account and Enter your Username and Password:<p><table><tr><td>Username:</td><td><b>${user.userName}</b></td></tr><tr><td>Password:</td><td><b>${user.password}</b></td></tr></table></td></tr></table></body></html>`;

        this.repository.sequelize &&
          (await sendMail(
            user.email,
            html,
            this.repository.sequelize,
            uniqueId,
            EmailActionType.USER_CREATION,
            null,
            "CreatE: User Access"
          ));
      }

      return user;
    } catch (error) {
      throw error;
    }
  };

  public upadteUser = async (
    id: number,
    userbody: UpdateUserPayload,
    outletId: number,
    roleId: number,
    isActive: boolean,
    outletUserDbInterface: OutletUserDbInterface,
    userID: number
  ): Promise<UserDbModel> => {
    try {
      const user = await this.updateUserById(id, userbody, userID);
      await outletUserDbInterface.updateUserRole(
        user.id,
        outletId,
        roleId,
        isActive
      );
      return this.getUserByUserIdAndOutletId(id, outletId, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteUser = async (
    userId: number,
    outltId: number,
    outletUserDbInterface: OutletUserDbInterface
  ): Promise<number> => {
    try {
      const user = await this.checkUserById(userId);
      if (!user) {
        throw new ApiError({
          message: Exceptions.INVALID_USER,
          statusCode: StatusCode.NOTFOUND,
        });
      }
      await outletUserDbInterface.delete(userId, outltId);
      return user.id;
    } catch (error) {
      throw error;
    }
  };

  public resetPassword = async (
    userId: number,
    resetPasswordRequest: ResetPasswordRequest
  ): Promise<UserDbModel> => {
    try {
      const user = await this.checkUserById(userId);
      if (!user) {
        throw new ApiError({
          message: Exceptions.INVALID_USER,
          statusCode: StatusCode.NOTFOUND,
        });
      }

      user.password = resetPasswordRequest.password;
      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  };

  public createSuperAdmin = async (
    createSuperAdminPayload: CreateSuperAdminPayload,
    outletUserDbInterface: OutletUserDbInterface,
    userId: number,
    uniqueId: string
  ): Promise<UserDbModel> => {
    try {
      let user = await this.getUserOutLetsByUserName(
        createSuperAdminPayload.email,
        false
      );

      //check if user is exist or not
      if (user) {
        //Super Admin
        if (user.roleId) {
          throw new ApiError({
            message: Exceptions.ALREADY_USER_PERMISSION,
            statusCode: StatusCode.BAD_REQUEST,
          });
        } else {
          if (user.OutletUser && user.OutletUser.length > 0) {
            await outletUserDbInterface.deleteByUserId(user.id);
          }
          user.roleId = 1;
          await user.save();
        }
      } else {
        //create User and crete UserOutlet
        const password = generate({
          length: 10,
          numbers: true,
        });

        user = await this.repository.create({
          userName: createSuperAdminPayload.email,
          email: createSuperAdminPayload.email,
          password: password,
          roleId: 1,
          createdBy: userId,
          updatedBy: userId,
        });

        //send Mail
        let html = `<html><body><table cellpadding="10" style="max-width:600pt;background-color:#b6d0e7;font-family:Arial,Helvetica,Sans-Serif;font-size:11pt"><tr><td colspan="2">Dear ${user.userName}</p></td></tr><tr><td width="20pt"></td><td style="background-color:#fff"><p>Your CreatE Account was created. Please start your CreatE Account and enter your username and password:<p><table><tr><td>Username:</td><td><b>${user.userName}</b></td></tr><tr><td>Password:</td><td><b>${user.password}</b></td></tr></table></td></tr></table></body></html>`;

        this.repository.sequelize &&
          (await sendMail(
            user.email,
            html,
            this.repository.sequelize,
            uniqueId,
            EmailActionType.SUPERUSER_CREATION,
            null,
            "CreatE: SuperUser Access"
          ));
      }

      return user;
    } catch (error) {
      throw error;
    }
  };

  public getAllSuperAdmin = async (): Promise<UserDbModel[]> => {
    try {
      let superAdmin = await this.repository.findAll({
        where: {
          roleId: 1,
        },
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
            required: false,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });

      return superAdmin;
    } catch (error) {
      throw error;
    }
  };

  public updateUserById = async (
    id: number,
    userbody: UpdateUserPayload,
    userId: number
  ): Promise<UserDbModel> => {
    try {
      let user = await this.repository.update(
        { ...userbody, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );
      if (user[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_USER,
          statusCode: StatusCode.NOTFOUND,
        });
      return this.checkUserById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteSuperAdmin = async (
    userId: number,
    updatedByUser: number
  ): Promise<UserDbModel> => {
    try {
      let user = await this.checkUserById(userId);
      user.set({ roleId: null });
      user.updatedBy = updatedByUser;
      await user.save();
      await user.destroy();
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Get user outlets by CompanyId
  public getUserOutLetsByCompanyId = async (
    companyId: number
  ): Promise<UserDbModel[]> => {
    try {
      const user = await this.repository.findAll({
        include: [
          {
            model: OutletUserDbModel,
            where: {
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletDbModel,
                where: {
                  companyId,
                  isActive: true,
                },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: RoleDbModel,
                where: {
                  isActive: true,
                },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });
      return user;
    } catch (error) {
      throw error;
    }
  };

  public deleteUserById = async (id: number): Promise<void> => {
    try {
      await this.repository.destroy({
        where: {
          id,
        },
      });
    } catch (error) {
      throw error;
    }
  };
}
