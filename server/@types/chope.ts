import { OutletDbModel } from "../db/models";
import { Customer } from "../db/interface";
import { BookingSource } from "../context";

export interface ReadEmailData {
  outlet: string;
  date: string;
  time: string;
  noOfPerson: string;
  name: string;
  bookingID: string;
  mobileNo: string;
  email: string;
  specialRequest?: string;
  status: string;
  source : BookingSource
}

export interface ChopeBookingPayload extends Customer {
  outlet: OutletDbModel;
  noOfPerson: number;
  bookingStartTime: Date;
  bookingEndTime: Date;
  mealType?: string;
  bookingType: string;
  occasion?: string;
  seatingPreference?: string;
  specialRequest?: string;
  reservationNotes?: string;
  salutation?: string;
  exactTime?: string;
  chopeBookingId: string;
  source: BookingSource
}
