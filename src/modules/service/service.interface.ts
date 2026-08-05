import { PriceType, ServiceStatus } from "../../../generated/prisma/enums";

export interface IService {
    id: string;
    title: string;
    description?: string | null;
    price: number;
    priceType: PriceType;
    duration?: number | null;
    serviceStatus: ServiceStatus;
}

export interface ICreateService {
    title: string;
    description?: string | null;
    price: number;
    priceType?: PriceType;
    duration?: number | null;
    categoryId: string;
    serviceStatus?: ServiceStatus;
}

export interface IUpdateService {
  title?: string;
  description?: string | null;
  price?: number;
  priceType?: PriceType;
  duration?: number | null;
  categoryId?: string;
  serviceStatus?: ServiceStatus;
}

export interface IServiceQuery {
    title?: string;
    priceMin?: number;
    priceMax?: number;
    serviceStatus?: ServiceStatus;
    categoryId?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
}
