import { ObjectId } from "mongodb";

export interface Player {
  _id: ObjectId;
  name: string;
  phone?: string;
  createdAt: Date;
}

export interface PlayerInput {
  name: string;
  phone?: string;
}
