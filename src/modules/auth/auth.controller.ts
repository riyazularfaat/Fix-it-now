import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { authService } from "./auth.service.js";
import { sendResponse } from "../../utils/sendRespond.js";
import httpStatus from "http-status";
import { activeStatus, VerifiedStatus } from "../../../generated/prisma/client.js";

const isProduction = process.env.NODE_ENV === "production";

const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge,
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
});

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const user = await authService.createUserIntoDB(payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User is successfully registered!",
      data: {
        user,
      },
    });
  },
);

const userLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    if (!payload.email || !payload.password) {
      throw new Error("email or password is missing!");
    }
    const result = await authService.loginUserIntoDB(payload);

    res.cookie(
      "accessToken",
      result.accessToken,
      getCookieOptions(1000 * 60 * 60 * 24),
    );

    res.cookie(
      "refreshToken",
      result.refreshToken,
      getCookieOptions(1000 * 60 * 60 * 24 * 7),
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User successfully login!",
      data: {
        result,
      },
    });
  },
);

const adminLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    if (!payload.email || !payload.password) {
      throw new Error("Email or password is missing!");
    }

    const result = await authService.adminLogin(payload);

    res.cookie(
      "accessToken",
      result.accessToken,
      getCookieOptions(1000 * 60 * 60 * 24),
    );
    res.cookie(
      "refreshToken",
      result.refreshToken,
      getCookieOptions(1000 * 60 * 60 * 24 * 7),
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin login successful",
      data: result,
    });
  },
);

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error("User ID is missing in the request");
    }

    const users = await authService.getAllUsers(userId, req.query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Users retrieved successfully",
      data: users,
    });
  },
);

const toggleUserStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.user?.id;
    const userId = req.params.userId;
    const status = req.body.status as activeStatus;

    if (!userId) {
      throw new Error("User ID is missing in the request");
    }

    const updatedUser = await authService.toggleUserStatus(id as string, userId as string, status);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User status updated successfully",
      data: updatedUser,
    });
  },
);

const verifyTechnician = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const adminId = req.user?.id;
    const technicianId = req.params.technicianId;
    const isVerified = req.body.isVerified as VerifiedStatus;

    const updatedProfile = await authService.verifyTechnician(adminId as string, technicianId as string, isVerified);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician verification status updated successfully",
      data: updatedProfile,
    });
  },
);

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    const { accessToken } = await authService.refreshToken(refreshToken);

    res.cookie(
      "accessToken",
      accessToken,
      getCookieOptions(1000 * 60 * 60 * 24),
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Token successfully refreshed!",
      data: {
        accessToken,
      },
    });
  },
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", getClearCookieOptions());
    res.clearCookie("refreshToken", getClearCookieOptions());

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User logged out successfully!",
      data: null,
    });
  },
);

export const authController = {
  createUser,
  userLogin,
  adminLogin,
  refreshToken,
  getAllUsers,
  toggleUserStatus,
  verifyTechnician,
  logout,
};
