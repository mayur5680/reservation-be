import { BookingStatus } from "../context";

export interface FilterInvoice {
  date: Date;
  mealType?: string;
  status?: string;
}

export interface TableChangeRequest {
  noOfAdult: number;
  noOfChild: number;
  startTime: string;
  date: Date;
  outletTables: number[];
  endDate?: Date;
  endTime?: string;
}

export interface UpdateInvoice {
  status: BookingStatus | string;
  occasion?: string;
  specialRequest?: string;
  seatingPreference?: string;
  reservationNotes?: string;
  dietaryRestriction?: string;
  customerCompanyName?: string;
  tableChangeRequest?: TableChangeRequest | null;
  mealType?: string;
  bookingStartTime?: Date;
  bookingEndTime?: Date;
  bookingDate?: Date;
  noOfPerson?: number;
  noOfAdult?: number;
  noOfChild?: number;
  isCharge?: boolean;
}
