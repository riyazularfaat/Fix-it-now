import { prisma } from "../../lib/prisma";
import { PriceType, Prisma, ServiceStatus} from "../../../generated/prisma/client";
import {
  IService,
  ICreateService,
  IUpdateService,
  IServiceQuery,
} from "./service.interface";

const servicePayload = new Set([
  "id",
  "title",
  "description",
  "technicianId",
  "categoryId",
  "price",
  "priceType",
  "duration",
  "serviceStatus",
]);

const serviceSortedField = (sortBy?: string) => {
  if (sortBy && servicePayload.has(sortBy)) {
    return sortBy;
  }

  return "title";
};

const getMyProfileFromDb = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
  });

  if (user.role !== "TECHNICIAN") {
    throw new Error("Access denied: Technician role required");
  }

  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: {
      userId: userId,
    },
  });

  return {
    ...user,
    ...technicianProfile,
  };
};

const createServiceIntoDb = async (userId: string, payload: ICreateService) => {
  const user = await getMyProfileFromDb(userId);
  if (user.role !== "TECHNICIAN") {
    throw new Error("Access denied: Only technicians can create services");
  }

  const techProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId: userId },
  });
  const technicianId = techProfile.id;

  const service = await prisma.service.create({
    data: {
      title: payload.title,
      description: payload.description ?? null,
      price: payload.price,
      priceType: payload.priceType ?? PriceType.FIXED,
      duration: payload.duration ?? null,
      serviceStatus: payload.serviceStatus ?? ServiceStatus.ACTIVE,
      technicianId,
      categoryId: payload.categoryId,
    }
  });

  return service;
};

const getAllServices = async (userId: string, query: IServiceQuery) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });
  
  if (!user) {
    throw new Error("Access denied: You must be logged in to access services.");
  }

  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = serviceSortedField(query.sortBy);
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: Prisma.ServiceWhereInput[] = [];

  if (query.title) {
    andConditions.push({
      title: {
        contains: query.title,
        mode: "insensitive",
      },
    });
  }

  if (query.priceMin !== undefined) {
    andConditions.push({
      price: {
        gte: query.priceMin,
      },
    });
  }

  if (query.priceMax !== undefined) {
    andConditions.push({
      price: {
        lte: query.priceMax,
      },
    });
  }

  if (query.serviceStatus) {
    andConditions.push({
      serviceStatus: query.serviceStatus,
    });
  }

  if (query.categoryId) {
    andConditions.push({
      categoryId: query.categoryId,
    });
  }

  let total = await prisma.service.count({
    where: {
      AND: andConditions,
    },
  });

  const services = await prisma.service.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  return {
    data: services,
    meta: {
      page,
      limit,
      total: total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMyServices = async (userId: string, query: IServiceQuery) => {
  const user = await getMyProfileFromDb(userId);
  if (user.role !== "TECHNICIAN") {
    throw new Error("Access denied: Technician role required");
  }

  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: {
      userId,
    },
  });

  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = serviceSortedField(query.sortBy);
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: Prisma.ServiceWhereInput[] = [];

  andConditions.push({
    technicianId: technicianProfile.id,
  });

  if (query.title) {
    andConditions.push({
      title: {
        contains: query.title,
        mode: "insensitive",
      },
    });
  }

  if (query.priceMin !== undefined) {
    andConditions.push({
      price: {
        gte: query.priceMin,
      },
    });
  }

  if (query.priceMax !== undefined) {
    andConditions.push({
      price: {
        lte: query.priceMax,
      },
    });
  }

  if (query.serviceStatus) {
    andConditions.push({
      serviceStatus: query.serviceStatus,
    });
  }

  if (query.categoryId) {
    andConditions.push({
      categoryId: query.categoryId,
    });
  }

  let total = await prisma.service.count({
    where: {
      AND: andConditions,
    },
  });

  const services = await prisma.service.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    }
  });

  return {
    data: services,
    meta: {
      page,
      limit,
      total: total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateServiceIntoDb = async (
  userId: string,
  serviceId: string,
  payload: IUpdateService,
) => {
  const user = await getMyProfileFromDb(userId);
  if (user.role !== "TECHNICIAN") {
    throw new Error("Access denied: Only technicians can update services");
  }

  const service = await prisma.service.findUniqueOrThrow({
    where: { id: serviceId },
  });

  const techProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId: userId },
  });

  if (service.technicianId !== techProfile.id) {
    throw new Error(
      "Access denied: Service does not belong to this technician",
    );
  }

  const updateData: Prisma.ServiceUpdateInput = {} as Prisma.ServiceUpdateInput;
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined)
    updateData.description = payload.description ?? null;
  if (payload.price !== undefined) updateData.price = payload.price;
  if (payload.priceType !== undefined) updateData.priceType = payload.priceType;
  if (payload.duration !== undefined) updateData.duration = payload.duration;
  if (payload.categoryId !== undefined) {
    updateData.category = {
      connect: { id: payload.categoryId },
    };
  }
  if (payload.serviceStatus !== undefined)
    updateData.serviceStatus = payload.serviceStatus;

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: updateData
  });

  return updated;
};

const deleteServiceIntoDb = async (userId: string, serviceId: string) => {
  const user = await getMyProfileFromDb(userId);
  if (user.role !== "TECHNICIAN") {
    throw new Error("Access denied: Only technicians can delete services");
  }

  const service = await prisma.service.findUniqueOrThrow({
    where: { id: serviceId },
  });

  const techProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId: userId },
  });

  if (service.technicianId !== techProfile.id) {
    throw new Error(
      "Access denied: Service does not belong to this technician",
    );
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      serviceStatus: ServiceStatus.INACTIVE,
    }
  });

  return updated;
};

export const serviceService = {
  createServiceIntoDb,
  getAllServices,
  getMyServices,
  updateServiceIntoDb,
  deleteServiceIntoDb,
};
