// src/domains/booking/booking.service.ts
import { prisma } from "../../lib/prisma";
import { BookingStatus, Prisma } from "../../../generated/prisma/client";
import {
    ICreateBooking,
    IUpdateBookingStatus,
    ICancelBooking,
    IBookingQuery,
} from "./booking.interface";
import {
    BookingWhereInput,
    PaymentWhereInput,
} from "../../../generated/prisma/models";
import { ReviewWhereInput } from "../../../generated/prisma/models";

const getMyProfileFromDb = async (userId: string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id: userId,
        },
        omit: {
            password: true,
        },
    });

    return user;
};


const createBookingIntoDb = async (customerId: string, payload: ICreateBooking) => {

    const user = await getMyProfileFromDb(customerId);

    if (user.role !== "CUSTOMER") {
        throw new Error("Access denied: Only customers can create bookings");
    }

    const { serviceId, scheduledStart, address, totalAmount, currency } = payload;

    const service = await prisma.service.findUniqueOrThrow({
        where: { id: serviceId },
        include: {
            technician: true,
            category: true
        }
    });


    const technicianId = service.technicianId;


    const start = new Date(scheduledStart);
    const end = new Date(start.getTime() + (service.duration || 0) * 60000);

    const conflict = await prisma.booking.findFirst({
        where: {
            technicianId,
            status: {
                in: ['REQUESTED', 'ACCEPTED', 'PAID', 'IN_PROGRESS']
            },
            AND: [
                {
                    scheduledStart: { lt: end }
                },
                {
                    scheduledEnd: { gt: start }
                }
            ]
        }
    });

    if (conflict) {
        throw new Error("Technician not available at the requested time");
    }


    const booking = await prisma.booking.create({
        data: {
            serviceId,
            customerId,
            technicianId,
            scheduledStart: start,
            scheduledEnd: end,
            address,
            totalAmount,
            currency: currency ?? 'BDT',
            status: 'REQUESTED',
        },
        include: {
            customer: { omit: { password: true } },
            service: { include: { category: true } },
            payment: true,
            review: true,
        },
    });

    return booking;
};

const getMyBookingsFromDb = async (userId: string, query: IBookingQuery) => {
  const user = await getMyProfileFromDb(userId);

  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "scheduledStart";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: BookingWhereInput[] = [];


  if (user.role === "CUSTOMER") {
    andConditions.push({
      customerId: userId,
    });
  } else if (user.role === "TECHNICIAN") {
    andConditions.push({
      technicianId: userId,
    });
  }
  if (query.status) {
    andConditions.push({
      status: query.status,
    });
  }

  if (query.scheduledStart) {
    andConditions.push({
      scheduledStart: {
        gte: new Date(query.scheduledStart),
      },
    });
  }

  if (query.scheduledEnd) {
    andConditions.push({
      scheduledEnd: { lte: new Date(query.scheduledEnd) },
    });
  }

  if (query.serviceId) {
    andConditions.push({
      serviceId: query.serviceId,
    });
  }

  let total = await prisma.booking.count({
    where: {
      AND: andConditions,
    },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      customer: {
        omit: {
          password: true,
        },
      },
      service: {
        include: {
          category: true,
        },
      },
      payment: true,
      review: true,
    },
  });

  return bookings;
};


const getBookingByIdFromDb = async (userId: string, bookingId: string) => {
  const user = await getMyProfileFromDb(userId);

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: {
      customer: {
        omit: { password: true },
      },
      service: {
        include: {
          category: true,
        },
      },
      payment: true,
      review: true,
    },
  });

  if (
    user.role !== "ADMIN" &&
    booking.customerId !== userId &&
    booking.technicianId !== userId
  ) {
    throw new Error("Not authorized to view this booking");
  }

  return booking;
};

const cancelBookingIntoDb = async (
  userId: string,
  bookingId: string,
  cancellationReason?: string,
) => {
  const user = await getMyProfileFromDb(userId);

  if (user.role !== "CUSTOMER") {
    throw new Error("Access denied: Only customers can cancel bookings");
  }

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  if (booking.customerId !== userId) {
    throw new Error("You are not the customer of this booking");
  }

  if (!["REQUESTED", "ACCEPTED"].includes(booking.status)) {
    throw new Error(
      `Cannot cancel booking in current state: ${booking.status}`,
    );
  }

  const cancelled = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancellationReason: cancellationReason,
    },
    include: {
        customer: {
            omit: {
                password: true
            }
        },
        service: {
            include: { category: true }
        },
      payment: true,
      review: true,
    },
  });

  return cancelled;
};


const updateBookingStatusIntoDb = async (
  userId: string,
  bookingId: string,
  status: BookingStatus,
) => {
  const user = await getMyProfileFromDb(userId);

  if (user.role !== "TECHNICIAN") {
    throw new Error(
      "Access denied: Only technicians can update booking status",
    );
  }

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
  });

  if (booking.technicianId !== userId) {
    throw new Error("Only the assigned technician can update status");
  }

  const allowedTransitions: Record<string, string[]> = {
    REQUESTED: ["ACCEPTED", "DECLINED"],
    ACCEPTED: ["PAID", "IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
    PAID: ["IN_PROGRESS"],
    DECLINED: [],
    COMPLETED: [],
    CANCELLED: [],
  };

  if (!allowedTransitions[booking.status]?.includes(status)) {
    throw new Error(`Cannot transition from ${booking.status} to ${status}`);
  }

  const updateData: Prisma.BookingUpdateInput = { status };

  if (status === "COMPLETED") {
    updateData.completedAt = new Date();
  }


  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
    include: {
      customer: { omit: { password: true } },
      service: { include: { category: true } },
      payment: true,
      review: true,
    },
  });

  return updated;
};

export const bookingService = {
    getMyBookingsFromDb,
    getBookingByIdFromDb,
    createBookingIntoDb,
    cancelBookingIntoDb,
    updateBookingStatusIntoDb,
};
