import { Role } from "../../../generated/prisma/enums";

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  activeStatus?: boolean;
  profilePhoto?: string;
  bio?: string;
  yearsExperience?: number;
  hourlyRate?: number;
}

