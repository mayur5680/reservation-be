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
  HasOne,
} from "sequelize-typescript";

import {
  CompanyDbModel,
  CustomerDbModel,
  IvrsCallLogsDbModel,
  IvrsVoiceCallDbModel,
  OutletDbModel,
  UserDbModel,
} from ".";

@Table({
  tableName: "IvrsDetails",
  freezeTableName: true,
})
export class IvrsDetailsDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column({
    unique: "IvrsDetails_callerId_key",
  })
  declare callerId: string;

  @AllowNull(true)
  @Column
  declare sip: string;

  @AllowNull(true)
  @Column
  declare callstart: Date;

  @AllowNull(true)
  @Column
  declare callend: Date;

  @AllowNull(false)
  @Column
  declare from: string;

  @AllowNull(false)
  @Column
  declare to: string;

  @AllowNull(true)
  @Column
  declare duration: string;

  @AllowNull(true)
  @Column
  declare status: string;

  @AllowNull(true)
  @Column
  declare direction: string;

  @AllowNull(true)
  @Column
  declare is_recorded: boolean;

  @AllowNull(true)
  @Column
  declare notes: string;

  @AllowNull(true)
  @Column
  declare pbx_call_id: string;

  @AllowNull(true)
  @Column
  declare tags: string;

  @AllowNull(true)
  @Column
  declare pressedDigit: string;

  @Default(false)
  @Column
  declare isEmailSend: boolean;

  @Default(false)
  @Column
  declare isDone: boolean;

  @Default(false)
  @Column
  declare is_completed: boolean;

  @AllowNull(true)
  @ForeignKey(() => CompanyDbModel)
  @Column
  declare companyId: number;

  @BelongsTo(() => CompanyDbModel)
  declare Company?: CompanyDbModel;

  @AllowNull(true)
  @ForeignKey(() => CustomerDbModel)
  @Column
  declare customerId: number;

  @BelongsTo(() => CustomerDbModel)
  declare Customer?: CustomerDbModel;

  @AllowNull(true)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

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

  @HasMany(() => IvrsCallLogsDbModel)
  declare OutletSeatType?: IvrsCallLogsDbModel[];

  @HasOne(() => IvrsVoiceCallDbModel)
  declare IvrsVoiceCall?: IvrsVoiceCallDbModel;
}
