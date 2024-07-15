import { BookingStatus } from "../context";

export interface SeatingViewPayload {
  outletSeatingTypeId: number;
  date?: Date;
  mealType: string;
}

export interface UpdateStatusPayload extends SeatingViewPayload {
  outletTableBookingId: number;
  status: BookingStatus;
}

export interface MoveTableRequestPayload extends SeatingViewPayload {
  outletTableBookingId: number;
  toOutleTableId: number;
}
