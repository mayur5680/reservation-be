export interface BookingTablePayload {
  noOfAdult: number;
  noOfChild: number;
  startTime: string;
  date: Date;
  outletSeatingTypeId: number;
}

export interface NewReservationBookingPayload extends BookingTablePayload {
  name: string;
  lastName?: string;
  email: string;
  mobileNo: string;
  bookingType: string;
  specialRequest?: string;
  reservationNotes?: string;
  image?: string;
  outletTables: string;
}

export interface PrivateEventPayload {
  noOfAdult: number;
  noOfChild: number;
  startTime: string;
  endTime: string;
  outletSeatingTypeId: number;
  startDate: Date;
  endDate: Date;
}

export interface NewPrivateEventBookingPayload extends PrivateEventPayload {
  name: string;
  lastName?: string;
  email: string;
  mobileNo: string;
  bookingType: string;
  mealType: string;
  specialRequest?: string;
  reservationNotes?: string;
  image?: string;
  outletTables: string;
  price?: number;
}
