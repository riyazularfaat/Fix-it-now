import { BookingStatus } from "../../../generated/prisma/enums.js";
import { BookingWhereInput } from "../../../generated/prisma/models.js";
import { PaymentWhereInput } from "../../../generated/prisma/models.js";
import { ReviewWhereInput } from "../../../generated/prisma/models.js";

export interface IBooking {
  id: string;
  customerId: string;
  technicianId: string;
  serviceId: string;
  scheduledStart: Date;
  scheduledEnd?: Date | null;
  address: string;
  latitude?: number;
  longitude?: number;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  cancellationReason?: string | null;
  completedAt?: Date | null;
}

export interface ICreateBooking {
  serviceId: string;
  scheduledStart: string; 
  address: string;
  currency?: string;
}

export interface IUpdateBookingStatus {
  status: BookingStatus;
}


export interface ICheckAvailability {
  technicianId: string;
  serviceId: string;
  scheduledStart: string;
}

export interface IAvailabilityResult {
  available: boolean;
  reason?: string;
}

export interface IBookingQuery extends BookingWhereInput {
  scheduledStart?: string; // ISO date string (gte)
  scheduledEnd?: string; // ISO date string (lte)
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface IPaymentQuery extends PaymentWhereInput {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface IReviewQuery extends ReviewWhereInput {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}
