import { prisma } from "../../lib/prisma.js";
import { PriceType, Prisma, ServiceStatus} from "../../../generated/prisma/client.js";
import {
  ICreateService,
  IUpdateService,
  IServiceQuery,
  ISyncServiceToStripe,
} from "./service.interface.js";
import { stripe} from "../../lib/stripe.js";

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


const syncServiceToStripe = async (serviceData: ISyncServiceToStripe) => {

  if (serviceData.priceType !== "FIXED") {
    return {
      productId: null,
      priceId: null
    };
  }

  const product = await stripe.products.create({
    name: serviceData.title,
    description: serviceData.description ?? undefined,
    metadata: {
      serviceId: "placeholder", // Will update after service creation
    },
  });


  const price = await stripe.prices.create({
    unit_amount: Math.round(serviceData.price * 100), // Convert to cents
    currency: "bdt".toLowerCase(),
    product: product.id,
    recurring: undefined,
  });

  return {
    productId: product.id,
    priceId: price.id,
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

  const stripeSync = await syncServiceToStripe({
    title: payload.title,
    description: payload.description,
    price: payload.price,
    priceType: payload.priceType,
  });

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
      stripeProductId: stripeSync.productId,
      stripePriceId: stripeSync.priceId,
      currency: payload.currency ?? "BDT",
    },
  });


  if (stripeSync.productId) {
    await stripe.products.update(stripeSync.productId, {
      metadata: {
        serviceId: service.id,
      },
    });
  }

  return service;
};

const getAllServices = async (query: IServiceQuery) => {
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

  if (total === 0) {
    throw new Error("No services found!");
  }

  const services = await prisma.service.findMany({
    where: {
      AND: andConditions,
      serviceStatus: ServiceStatus.ACTIVE,
    },
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  return {
    services: services,
    meta: {
      page,
      limit,
      total: total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAllServicesAdmin = async (userId: string, query: IServiceQuery) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });
  if (user.role !== "ADMIN") {
    throw new Error("Access denied: Admin role required");
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

  if (total === 0) {
    throw new Error("No services found!");
  }

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
  getAllServicesAdmin,
};
