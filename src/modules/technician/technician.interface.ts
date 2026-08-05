import {
  activeStatus,
  Role,
  VarifiedStatus,
} from "../../../generated/prisma/enums";

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