export interface timelineViewPayload {
  date?: Date;
  mealType: string;
}

export interface MoveTableRequestPayload extends timelineViewPayload {
  outletTableBookingId: number;
  toOutleTableId: number;
  time: string;
}
