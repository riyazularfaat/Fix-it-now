import { Role } from "../../../generated/prisma/client.js";
import { UserWhereInput } from "../../../generated/prisma/models.js";

type RoleType = "CUSTOMER" | "TECHNICIAN";
export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: RoleType;
  profilePhoto?: string;
  bio?: string;
  yearsExperience?: number;
  hourlyRate?: number;
}
export interface IUser {
  email: string;
  password: string;
}

export interface IRefreshToken {
  refreshToken: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface IAuthUserQuery extends UserWhereInput {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}
