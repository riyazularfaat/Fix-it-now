import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendRespond";
import httpStatus from "http-status";
import { technicianService } from "./technician.service";
import {
  ISetAvailability,
  IUpdatePassword,
  IUpdateTechnician,
  IAvailabilityException,
  IProfessionalData,
} from "./technician.interface";

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
        updatedTechnician,
      },
    });
  },
);

const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = req.body as IUpdatePassword;

    const result = await technicianService.updatePassword(
      userId as string,
      payload,
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

    await technicianService.deactivateMyAccount(userId as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician account deactivated successfully",
      data: null,
    });
  },
);


const getMyPayments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const query = req.query;

    const result = await technicianService.getMyPayments(
      userId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician payments retrieved successfully",
      data: {
        result,
      },
    });
  },
);

const getMyReviewsReceived = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const query = req.query;

    const result = await technicianService.getMyReviewsReceived(
      userId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician reviews received successfully",
      data: {
        result,
      },
    });
  },
);


const getTechnicianAvailabilityExceptions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const technicianId = req.params.technicianId;

    const exceptions =
      await technicianService.getTechnicianAvailabilityExceptionsFromDb(
        technicianId as string,
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician availability exceptions retrieved successfully",
      data: {
        exceptions,
      },
    });
  },
);

const setAvailabilityException = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = req.body ;

    if (!userId) {
      throw new Error("User ID not found in request");
    }

    const result = await technicianService.setAvailabilityExceptionInDb(
      userId as string,
      payload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Availability exception set successfully",
      data: result,
    });
  },
);

const getMyAvailabilityExceptions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new Error("User ID not found in request");
    }

    const exceptions = await technicianService.getMyAvailabilityExceptionsFromDb(
      userId as string
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Availability exceptions retrieved successfully",
      data: {
        exceptions,
      },
    });
  },
);

const updateAvailabilityException = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const exceptionId = req.params.exceptionId;
    const payload = req.body;

    if (!userId) {
      throw new Error("User ID not found in request");
    }
    if (!exceptionId) {
      throw new Error("Exception ID not found in request");
    }
    if (!payload) {
      throw new Error("Invalid availability exception update data");
    }

    const result = await technicianService.updateAvailabilityExceptionInDb(
      userId as string,
      exceptionId as string,
      payload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Availability exception updated successfully",
      data: result,
    });
  },
);

const deleteAvailabilityException = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const exceptionId = req.params.exceptionId;

    if (!userId) {
      throw new Error("User ID not found in request");
    }
    if (!exceptionId) {
      throw new Error("Exception ID not found in request");
    }

    const result = await technicianService.deleteAvailabilityExceptionFromDb(
      userId as string,
      exceptionId as string
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Availability exception deleted successfully",
      data: result,
    });
  },
);

const updateProfessionalData = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id as string;
    const data = req.body as IProfessionalData;

    const result = await technicianService.updateTechnicianProfessionalData(userId,data);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Technician professional details modified successfully!",
      data: result,
    });
  },
);

export const technicianController = {
  getMyProfile,
  updateMyProfile,
  updatePassword,
  deactivateProfile,
  getMyPayments,
  getMyReviewsReceived,
  getTechnicianAvailabilityExceptions,
  setAvailabilityException,
  getMyAvailabilityExceptions,
  updateAvailabilityException,
  deleteAvailabilityException,
  updateProfessionalData,
};
