import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IBookingQuery, ICreateBooking, IUpdateBookingStatus } from "./booking.interface";
import { bookingService } from "./booking.service";
import { sendResponse } from "../../utils/sendRespond";
import httpStatus from "http-status";

const createBookingCtrl = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const customerId = req.user?.id as string;
    const payload = req.body as ICreateBooking;

    const result = await bookingService.createBookingIntoDb(
      customerId,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Booking created successfully",
      data: result,
    });
  },
);
const getAllBookings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const query = req.query as IBookingQuery;

    const result = await bookingService.getAllBookings(
      userId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All bookings retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);


const getMyBookings = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const query = req.query as IBookingQuery;

    const bookings = await bookingService.getMyBookingsFromDb(
      userId as string,
      query,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Bookings retrieved successfully",
      data: {
        bookings,
      },
    });
  },
);

const getBookingById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const bookingId = req.params.bookingId;
    

    const result = await bookingService.getBookingByIdFromDb(
      userId as string,
      bookingId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Booking retrieved successfully",
      data: result,
    });
  },
);

const cancelBooking = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const bookingId = req.params.bookingId;
  const { cancellationReason } = req.body ;

    const result = await bookingService.cancelBookingIntoDb(
      userId as string,
      bookingId as string,
      cancellationReason
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Booking cancelled successfully",
      data: result,
    });
  },
);

const updateBookingStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const bookingId = req.params.bookingId;
    const { status } = req.body as IUpdateBookingStatus;

    const result = await bookingService.updateBookingStatusIntoDb(
      userId as string,
      bookingId as string,
      status,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Booking status updated successfully",
      data: result,
    });
  },
);

const checkAvailability = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const technicianId =  req.body.technicianId
    const serviceId = req.body.serviceId 
    const scheduledStart = req.body.scheduledStart

    const result = await bookingService.checkAvailabilityFromDb({technicianId, serviceId, scheduledStart});

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.available
        ? "Technician is available at the requested time"
        : "Technician is not available at the requested time",
      data: result,
    });
  },
);


export const bookingController = {
  createBookingCtrl,
  checkAvailability,
  getAllBookings,
  getMyBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
};
