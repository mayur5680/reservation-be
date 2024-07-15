"use strict";

export interface Coupon {
  id?: number;
  name: string;
  outletId: number;
  startDate: Date;
  endDate: Date;
  openingTime: string;
  closingTime: string;
  discountAmount: number;
  noOfPerson: number;
  repeatOn: string;
  tc?: string;
  isCampaignActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
