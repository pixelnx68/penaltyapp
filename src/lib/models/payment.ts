import { ObjectId } from "mongodb";

export interface PaymentAllocation {
  penaltyDate: string;
  amount: number;
}

export interface Payment {
  _id: ObjectId;
  playerId: ObjectId;
  date: string;
  amount: number;
  allocations: PaymentAllocation[];
  createdAt: Date;
}
