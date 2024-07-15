"use strict";

export interface SMSTemplate {
  id?: number;
  name: string;
  templateType: string;
  contentLanguage: string;
  body: string;
  outletId: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
