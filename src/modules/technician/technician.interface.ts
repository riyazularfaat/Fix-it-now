import {
  activeStatus,
  BookingStatus,
  Role,
  VarifiedStatus,
} from "../../../generated/prisma/enums";
import { BookingWhereInput, PaymentWhereInput, ReviewWhereInput } from "../../../generated/prisma/models";

export interface ITechnician {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  activeStatus?: activeStatus;
  bio?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  skills?: string[];
  avgRating?: number;
  totalReviews?: number;
  profilePhoto?: string;
  isVarified?: VarifiedStatus;
}

export interface IUpdateTechnician {
  name?: string;
  email?: string;
  phone?: string | null;
  bio?: string;
  yearsExperience?: number;
  hourlyRate?: number;
  profilePhoto?: string;
}

export interface IUpdatePassword {
  currentPassword: string;
  newPassword: string;
}

export interface ITechnicianBookingsQuery extends BookingWhereInput {
  status?: BookingStatus;
  scheduledStart?: string; // ISO date string (gte)
  scheduledEnd?: string; // ISO date string (lte)
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ITechnicianPaymentsQuery extends PaymentWhereInput {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface ITechnicianReviewsQuery extends ReviewWhereInput {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}