import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { serviceService } from "./service.service.js";
import { sendResponse } from "../../utils/sendRespond.js";
import httpStatus from "http-status";
import {
  ICreateService,
  IUpdateService,
  IServiceQuery,
} from "./service.interface.js";

const createService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const payload = req.body as ICreateService;

    const result = await serviceService.createServiceIntoDb(
      userId as string,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Service created successfully",
      data: result,
    });
  },
);

const getAllServices = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const query = req.query as IServiceQuery;

    const result = await serviceService.getAllServices(userId as string, query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getMyServices = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const query = req.query as IServiceQuery;

    const result = await serviceService.getMyServices(userId as string, query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "My services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const updateService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const serviceId = req.params.serviceId;
    const payload = req.body as IUpdateService;

    const result = await serviceService.updateServiceIntoDb(
      userId as string,
      serviceId as string,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Service updated successfully",
      data: result,
    });
  },
);

const deleteService = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const serviceId = req.params.serviceId;

    const result = await serviceService.deleteServiceIntoDb(
      userId as string,
      serviceId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Service deleted successfully",
      data: result,
    });
  },
);

export const serviceController = {
  createService,
  getAllServices,
  getMyServices,
  updateService,
  deleteService,
};
