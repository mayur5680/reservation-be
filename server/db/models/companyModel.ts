"use strict";

import {
  Column,
  PrimaryKey,
  Model,
  AutoIncrement,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  ForeignKey,
  BelongsTo,
  AllowNull,
  DeletedAt,
  HasMany,
} from "sequelize-typescript";

import { UserDbModel, OutletDbModel, MarketingDbModel } from ".";

@Table({
  tableName: "Company",
  freezeTableName: true,
})
export class CompanyDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare key: string;

  @AllowNull(false)
  @Column
  declare name: string;

  @AllowNull(true)
  @Column
  declare contentLanguage: string;

  @AllowNull(true)
  @Column
  declare description: string;

  @AllowNull(true)
  @Column
  declare mailChimpPublicKey: string;

  @AllowNull(true)
  @Column
  declare mailChimpPrivateKey: string;

  @AllowNull(true)
  @Column
  declare mailChimpUserName: string;

  @AllowNull(true)
  @Column
  declare tags: string;

  @Default(false)
  @Column
  declare mailChimpStatus: boolean;

  @AllowNull(true)
  @ForeignKey(() => MarketingDbModel)
  @Column
  declare marketingId: number;

  @BelongsTo(() => MarketingDbModel)
  declare Marketing?: MarketingDbModel;

  @AllowNull(true)
  @Column
  declare ivrsUserKey: string;

  @AllowNull(true)
  @Column
  declare ivrsSecretKey: string;

  @AllowNull(true)
  @Column
  declare twilioAccountSid: string;

  @AllowNull(true)
  @Column
  declare twilioAuthToken: string;

  @AllowNull(true)
  @Column
  declare twilioMessagingServiceSid: string;

  @AllowNull(true)
  @Column
  declare paymentTC: string;

  @AllowNull(true)
  @Column
  declare noPaymentTC: string;

  @AllowNull(true)
  @Column
  declare image: string;

  @AllowNull(true)
  @Column
  declare timezone: string;

  @Default(true)
  @Column
  declare isActive: boolean;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @AllowNull(true)
  @UpdatedAt
  @Column
  declare updatedAt: Date;

  @AllowNull(true)
  @DeletedAt
  @Column
  declare deletedAt: Date;

  @ForeignKey(() => UserDbModel)
  @Column
  declare createdBy: number;

  @ForeignKey(() => UserDbModel)
  @Column
  declare updatedBy: number;

  @BelongsTo(() => UserDbModel, {
    targetKey: "id",
    foreignKey: "updatedBy",
  })
  declare User?: UserDbModel;

  @HasMany(() => OutletDbModel)
  declare Outlet?: OutletDbModel[];
}
