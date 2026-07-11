import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { customerService } from "./customer.service";
import { sendResponse } from "../../utils/sendRespond";
import httpStatus from "http-status";
import { ICustomerBookingsQuery, IUpdatePassword } from "./customer.interface";


const getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const users = await customerService.getAllUsersFromDB();

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Users retrieved successfully!",
            data: {
                users,
            },
        });
    }
);

const getMyProfile = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const userProfile = await customerService.getMyProfileFromDb(userId as string);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User profile retrieved successfully!",
            data: {
                user: userProfile,
            },
        });
    }
);

const updateMyProfile = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id as string;
        const payload = req.body;

        const updatedUser = await customerService.updateMyProfileInDb(userId, payload);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User is successfully updated!",
            data: { updatedUser },
        });
    },
);

const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = req.body;

    const result = await customerService.updatePassword(userId as string, payload as IUpdatePassword,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password updated successfully",
      data: result,
    });
  },
);

const deactivateProfile = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;

        await customerService.deactivateMyAccount(userId as string);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Customer account deactivated successfully",
            data: null,
        });
    },
);



export const userController = {
    getAllUsers,
    getMyProfile,
    updateMyProfile,
    updatePassword,
    deactivateProfile,
    // getBookings,
};
