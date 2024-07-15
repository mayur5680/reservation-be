"use strict";

export interface IvrsVoiceCall {
  id?: number;
  path: string;
  fromPhoneNo: string;
  time: Date;
  isLink?: boolean;
  IvrsDetailId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
