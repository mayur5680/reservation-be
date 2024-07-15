export interface AddPossibiltyPayload {
  outletTable: number[];
}

export interface CreateGroupTablePayload extends AddPossibiltyPayload {
  name: string;
  minPax: number;
  maxPax: number;
}

export interface UpdateGroupTablePayload extends CreateGroupTablePayload {
  isActive: boolean;
}
