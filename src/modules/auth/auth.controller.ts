import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendRespond";
import httpStatus from "http-status";

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
    const { acessToken, refreshToken } = await authService.loginUserIntoDB(payload);

    res.cookie("accessToken", acessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User is successfully registered!",
      data: {
        acessToken,
        refreshToken,
        user: {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role,
        },
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
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin login successful",
      data: result,
    });
  },
);

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    const { acessToken } = await authService.refreshToken(refreshToken);

    res.cookie("accessToken", acessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Token successfully refreshed!",
      data: {
        acessToken,
      },
    });
  },
);



export const authController = {
  createUser,
  userLogin,
  adminLogin,
  refreshToken,
};