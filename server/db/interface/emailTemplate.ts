"use strict";

export interface EmailTemplate {
  id?: number;
  name: string;
  templateType: string;
  contentLanguage: string;
  subject: string;
  body: string;
  outletId: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
