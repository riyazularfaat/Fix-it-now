import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userService } from "./user.service";
import { sendResponse } from "../../utils/sendRespond";
import httpStatus from "http-status";

// const createUser = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const payload = req.body;
//     const user = await userService.createUserIntoDB(payload);

//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.CREATED,
//       message: "User is successfully registered!",
//       data: {
//         user,
//       },
//     });
//   },
// );

const getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const users = await userService.getAllUsersFromDB();

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
        if (!userId) {
            throw new Error("User ID is missing in the request.");
        }
        const userProfile = await userService.getMyProfileFromDb(userId);

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

    const updatedUser = await userService.updateMyProfileInDb(userId, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User is successfully updated!",
      data: { updatedUser },
    });
  },
);

export const userController = {
  // createUser,
  getAllUsers,
  getMyProfile,
  updateMyProfile,
};
