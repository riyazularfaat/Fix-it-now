import { ServiceStatus } from "../../../generated/prisma/enums";

export interface ICategory {
  id: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateCategory {
  name: string;
  description?: string | null;
  iconUrl?: string | null;
}

export interface IUpdateCategory {
  name?: string;
  description?: string | null;
  iconUrl?: string | null;
  isActive?: boolean;
}

export interface ICategoryQuery {
  name?: string;
  isActive?: boolean;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}
