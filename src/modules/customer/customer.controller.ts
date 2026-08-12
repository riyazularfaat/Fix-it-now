import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { customerService } from "./customer.service";
import { sendResponse } from "../../utils/sendRespond";
import httpStatus from "http-status";
import { ICreateReviewPayload, ICustomerBookingsQuery, IUpdatePassword } from "./customer.interface";


const getAllTechnicians = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const users = await customerService.getAllTechnicianFromDB();

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
        const password = req.body.password;

        await customerService.deactivateMyAccount(userId as string, password);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Customer account deactivated successfully",
            data: null,
        });
    },
);

const getBookings = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        const query = req.query;

        const result = await customerService.getMyBookings(userId as string, query);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Customer bookings retrieved successfully",
            data: {
                result
            }
        });
    },
);

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string; 
  const payload = req.body as ICreateReviewPayload;

  const result = await customerService.createReviewIntoDb(userId, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review submitted successfully!",
    data: result,
  });
});

export const userController = {
  getAllTechnicians,
  getMyProfile,
  updateMyProfile,
  updatePassword,
  deactivateProfile,
  getBookings,
  createReview
};
