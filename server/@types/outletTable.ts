export interface OutletTableData {
  id: number;
  xPosition: number;
  yPosition: number;
}

export interface UpdatePositionPayload {
  outletTable: OutletTableData[];
}
