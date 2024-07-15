"use strict";

export interface Marketing {
  id?: number;
  name: string;
  description?: string;
  tags?: string;
  criteria?: string;
  mailchimpListId?: string;
  mergerField?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
