import {
  activeStatus,
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
  Role,
} from "../../../generated/prisma/enums";
import { BookingWhereInput } from "../../../generated/prisma/models";

export interface ICustomer {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  activeStatus?: activeStatus;
}

export interface IUpdateCustomer {
  name?: string;
  email?: string;
  phone?: string | null;
}

export interface IUpdatePassword {
  currentPassword: string;
  newPassword: string;
}

export interface ICustomerBookingsQuery extends BookingWhereInput {
  serviceId?: string;
  technicianId?: string;
  status?: BookingStatus;
  scheduledStart?: string; // ISO date string (gte)
  scheduledEnd?: string; // ISO date string (lte)
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ICreateReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
}