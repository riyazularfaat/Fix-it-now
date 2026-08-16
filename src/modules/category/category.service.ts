import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";
import {
    ICreateCategory,
    IUpdateCategory,
    ICategoryQuery,
} from "./category.interface.js";

const getMyProfileFromDb = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
  });
  return user;
}; 

const createCategoryIntoDb = async (
  userId: string,
  payload: ICreateCategory,
) => {
  const user = await getMyProfileFromDb(userId);
  if (user.role !== "ADMIN") {
    throw new Error("Access denied: Admin role required");
  }

  const existing = await prisma.category.findUnique({
    where: { name: payload.name },
  });

  if (existing) {
    throw new Error("Category name already exists");
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name,
      description: payload.description ?? null,
      iconUrl: payload.iconUrl ?? null,
      isActive: true,
    },
  });

  return category;
};


const getAllCategoriesPublic = async (query: ICategoryQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ? query.sortBy : "name";
    const sortOrder = query.sortOrder ? query.sortOrder : "asc";

    const andConditions: Prisma.CategoryWhereInput[] = [];

    if (query.name) {
        andConditions.push({
            name: {
                contains: query.name,
                mode: "insensitive",
            },
        });
    }

    if (query.isActive !== undefined) {
        andConditions.push({
            isActive: query.isActive,
        });
    }

    let total = await prisma.category.count({
        where: {
            AND: andConditions,
        },
    });

    if (total === 0) {
        throw new Error("No category found!");
    }

    const categories = await prisma.category.findMany({
        where: {
            AND: andConditions,
            isActive: true,
        },
        take: limit,
        skip: skip,
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    return {
        data: categories,
        meta: {
            page,   
            limit,
            total: total,
            totalPages: Math.ceil(total / limit),
        },
    };
};


const getAllCategoriesAdmin = async (userId: string, query: ICategoryQuery) => {
    const user = await getMyProfileFromDb(userId);

    if (user.role !== "ADMIN") {
        throw new Error("Access denied: Admin role required");
    }

    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ? query.sortBy : "name";
    const sortOrder = query.sortOrder ? query.sortOrder : "asc";

    const andConditions: Prisma.CategoryWhereInput[] = [];

    if (query.name) {
        andConditions.push({
            name: {
                contains: query.name,
                mode: "insensitive",
            },
        });
    }

    if (query.isActive !== undefined) {
        andConditions.push({
            isActive: query.isActive,
        });
    }

    let total = await prisma.category.count({
        where: {
            AND: andConditions,
        },
    });

    if (total === 0) {
        throw new Error("No categories found!");
    }
    const categories = await prisma.category.findMany({
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
        data: categories,
        meta: {
            page,
            limit,
            total: total,
            totalPages: Math.ceil(total / limit),
        },
    };
};


const updateCategoryIntoDb = async (
    userId: string,
    categoryId: string,
    payload: IUpdateCategory,
) => {

    const user = await getMyProfileFromDb(userId);
    if (user.role !== "ADMIN") {
        throw new Error("Access denied: Admin role required");
    }

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });

    if (!category) {
        throw new Error("Category not found");
    }

    if (payload.name && payload.name !== category.name) {
        const existing = await prisma.category.findUnique({
            where: { name: payload.name },
        });

        if (existing) {
            throw new Error("Category name already exists");
        }
    }

    const updateData: Prisma.CategoryUpdateInput = {};
    if (payload.name !== undefined)
        updateData.name = payload.name;
    if (payload.description !== undefined)
        updateData.description = payload.description ?? null;
    if (payload.iconUrl !== undefined)
        updateData.iconUrl = payload.iconUrl ?? null;
    if (payload.isActive !== undefined)
        updateData.isActive = payload.isActive;

    const updated = await prisma.category.update({
        where: { id: categoryId },
        data: updateData,
    });

    return updated;
};

const deleteCategoryIntoDb = async (userId: string, categoryId: string) => {
    const user = await getMyProfileFromDb(userId);
    if (user.role !== "ADMIN") {
        throw new Error("Access denied: Admin role required");
    }

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
    });

    if (!category) {
        throw new Error("Category not found");
    }

    const deleted = await prisma.category.delete({
        where: { id: categoryId },
    });

    return deleted;
};

export const categoryService = {
  createCategoryIntoDb,
  getAllCategoriesPublic,
  getAllCategoriesAdmin,
  updateCategoryIntoDb,
  deleteCategoryIntoDb,
};
