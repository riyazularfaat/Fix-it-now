import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { categoryService } from "./category.service.js";
import { sendResponse } from "../../utils/sendRespond.js";
import httpStatus from "http-status";
import {
    ICreateCategory,
    IUpdateCategory,
    ICategoryQuery,
} from "./category.interface.js";

const createCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const payload = req.body as ICreateCategory;

        const result = await categoryService.createCategoryIntoDb(
            userId as string,
            payload,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "Category created successfully",
            data: result,
        });
    },
);

const getAllCategoriesPublic = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const result = await categoryService.getAllCategoriesPublic();

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Categories retrieved successfully",
            data: result,
        });
    },
);

const getAllCategories = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const query = req.query as ICategoryQuery;

        const result = await categoryService.getAllCategoriesAdmin(
            userId as string,
            query,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Categories retrieved successfully",
            data: result.data,
            meta: result.meta,
        });
    },
);


const updateCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const categoryId = req.params.categoryId;
        const payload = req.body as IUpdateCategory;

        const result = await categoryService.updateCategoryIntoDb(
            userId as string,
            categoryId as string,
            payload,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Category updated successfully",
            data: result,
        });
    },
);


const deleteCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const categoryId = req.params.categoryId;

        const result = await categoryService.deleteCategoryIntoDb(
            userId as string,
            categoryId as string,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Category deleted successfully",
            data: result,
        });
    },
);

export const categoryController = {
    createCategory,
    getAllCategoriesPublic,
    getAllCategories,
    updateCategory,
    deleteCategory,
};
