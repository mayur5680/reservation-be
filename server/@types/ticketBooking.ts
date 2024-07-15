import {
  OutletDbModel,
  OutletTableDbModel,
  TicketingDbModel,
} from "../db/models";
import { Customer } from "../db/interface";

export interface TicketTimeSlotRequest {
  date: Date;
  noOfAdult: number;
  noOfChild: number;
}

export interface BookTicketPayload extends TicketTimeSlotRequest {
  name: string;
  lastName: string;
  email: string;
  mobileNo: string;
  customerCompanyName?: string;
  exactTime: string;
  bookingType: string;
  specialRequest?: string;
  salutation?: string;
  dietaryRestriction?: string;
  isOPT?: boolean;
  occasion?: string;
}

export interface CustomerBookingTicketPayload extends Customer {
  noOfPerson: number;
  noOfAdult: number;
  noOfChild: number;
  bookingStartTime: Date;
  bookingEndTime: Date;
  bookingType: string;
  specialRequest?: string;
  salutation?: string;
  exactTime?: string;
  mealType?: string;
  dietaryRestriction?: string;
  occasion?: string;
  isOPT?: boolean;
  outlet: OutletDbModel;
  ticketing: TicketingDbModel;
  outletTable: OutletTableDbModel[];
}
