"use strict";

export interface Ticketing {
  id?: number;
  name: string;
  outletId: number;
  startDate: Date;
  endDate: Date;
  openingTime: string;
  closingTime: string;
  amount: number;
  noOfPerson: number;
  ticketMaxQuantity: number;
  description?: string;
  timeSlotInterval: string;
  blockSchedule: boolean;
  blockTable: boolean;
  prePayment: boolean;
  image?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
