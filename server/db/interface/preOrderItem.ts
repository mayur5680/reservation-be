"use strict";

export interface PreOrderItem {
  id?: number;
  name: string;
  sectionId: number;
  outletId: number;
  price: number;
  dailyMaxQty: number;
  bookingMaxQty: number;
  originalPrice: number;
  maximumSpend?: Date;
  leadTime?: number;
  creditCardHoldAmount?: string;
  image?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  repeatOn?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
