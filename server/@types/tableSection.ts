export interface CreateTableSectionPayload {
  name: string;
  color: string;
  description: string;
  outletTable: number[];
  minPax?: number;
  maxPax?: number;
}

export interface CreatePrivateTableSectionPayload
  extends CreateTableSectionPayload {
  outletTables: string;
  image: string;
  originalPrice: number;
  price: number;
  blockTime?: string;
}

export interface UpdatePrivateTableSectionPayload
  extends CreateTableSectionPayload {
  isActive: boolean;
  image: string;
  originalPrice: number;
  price: number;
  blockTime?: string;
}
