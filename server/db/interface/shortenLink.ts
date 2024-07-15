"use strict";

export interface ShortenLink {
  id?: number;
  code: string;
  source: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
