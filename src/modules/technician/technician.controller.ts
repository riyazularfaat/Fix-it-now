import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespond";
import httpStatus from "http-status"
import { technicianService } from "./technician.service";
import { IUpdatePassword, IUpdateTechnician } from "./technician.interface";

const getMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const technicianProfile = await technicianService.getMyProfileFromDb(
      userId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician profile retrieved successfully!",
      data: {
        technician: technicianProfile,
      },
    });
  },
);

const getAllTechnicians = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const technicians = await technicianService.getAllTechniciansFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technicians retrieved successfully!",
      data: {
        technicians,
      },
    });
  },
);

const updateMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id as string;
    const payload = req.body as IUpdateTechnician;

    const updatedTechnician = await technicianService.updateMyProfileInDb(
      userId,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician is successfully updated!",
      data: {
        updatedTechnician
      },
    });
  },
);

const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = req.body as IUpdatePassword;

    const result = await technicianService.updatePassword(userId as string, payload);

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

    await technicianService.deactivateMyAccount(userId as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician account deactivated successfully",
      data: null,
    });
  },
);



export const technicianController = {
  getMyProfile,
  getAllTechnicians,
  updateMyProfile,
  updatePassword,
  deactivateProfile,
};