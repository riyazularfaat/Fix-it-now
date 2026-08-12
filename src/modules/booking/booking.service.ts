import { prisma } from "../../lib/prisma";
import { BookingStatus, Prisma } from "../../../generated/prisma/client";
import {
  ICreateBooking,
  IBookingQuery,
  ICheckAvailability,
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

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const getZonedDateParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  const hour = map.hour === "24" ? "00" : map.hour; // hour12:false can format midnight as "24"

  return {
    dayOfWeek: WEEKDAY_INDEX[map.weekday],
    time: `${hour}:${map.minute}`,
    dateStr: `${map.year}-${map.month}-${map.day}`,
  };
};


const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDate = (dateStr: string) => {
  if (!DATE_REGEX.test(dateStr)) {
    throw new Error(
      `date must be in "YYYY-MM-DD" format, received: ${dateStr}`,
    );
  }
  return new Date(`${dateStr}T00:00:00.000Z`);
};

const checkTechnicianAvailability = async (
  technicianId: string,
  timezone: string,
  start: Date,
  end: Date,
) => {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      available: false,
      reason: "scheduledStart is not a valid date",
    };
  }

  if (start < new Date()) {
    return {
      available: false,
      reason: "scheduledStart must be in the future",
    };
  }

  const startParts = getZonedDateParts(start, timezone);
  const endParts = getZonedDateParts(end, timezone);

  if (startParts.dateStr !== endParts.dateStr) {
    return {
      available: false,
      reason: "Booking cannot span multiple days",
    };
  }

  const isolatedDateString = `${startParts.dateStr}T00:00:00.000Z`;
  const exception = await prisma.availabilityException.findUnique({
    where: {
      technicianId_date: {
        technicianId,
        date: new Date(isolatedDateString),
      },
    },
  });

   if (exception) {
     if (exception.startTime === null && exception.endTime === null) {
       return {
         available: false,
         reason: "Technician is completely unavailable on this date.",
       };
     }

     if (exception.startTime && exception.endTime) {
       const isOverlapping =
         startParts.time < exception.endTime &&
         endParts.time > exception.startTime;
       if (isOverlapping) {
         return {
           available: false,
           reason: `Technician: ${exception?.reason}`
         };
       }
     }
   }

  const conflict = await prisma.booking.findFirst({
    where: {
      technicianId,
      status: {
        in: ["REQUESTED", "ACCEPTED", "PAID", "IN_PROGRESS"],
      },
      AND: [
        {
          scheduledStart: { lt: end }
        },
        {
          scheduledEnd: { gt: start }
        }
      ],
    },
  });

  if (conflict) {
    return {
      available: false,
      reason: "Technician already has a booking at the requested time",
    };
  }

  return {
    available: true,
  };
};

const checkAvailabilityFromDb = async (payload: ICheckAvailability) => {
  const { technicianId, serviceId, scheduledStart } = payload;

  const service = await prisma.service.findUniqueOrThrow({
    where: {
      id: serviceId,
    },
    include: {
      technician: true,
    },
  });

  if (service.technicianId !== technicianId) {
    throw new Error("This service does not belong to the specified technician");
  }

  let structuredDate = scheduledStart;
  if (
    !structuredDate.includes("Z") &&
    !structuredDate.match(/[+-]\d{2}:\d{2}$/)
  ) {
    structuredDate = `${structuredDate}+06:00`;
  }

  const start = new Date(scheduledStart);
  const end = new Date(start.getTime() + (service.duration || 0) * 60000);

  return checkTechnicianAvailability(
    technicianId,
    service.technician.timezone,
    start,
    end,
  );
};

const createBookingIntoDb = async (customerId: string, payload: ICreateBooking) => {
  const user = await getMyProfileFromDb(customerId);

  if (user.role !== "CUSTOMER") {
    throw new Error("Access denied: Only customers can create bookings");
  }

  const { serviceId, scheduledStart, address, totalAmount, currency } = payload;

  const service = await prisma.service.findUniqueOrThrow({
    where: { id: serviceId },
    include: { technician: true, category: true },
  });

  const technicianId = service.technicianId;
  const start = new Date(scheduledStart);
  const end = new Date(start.getTime() + (service.duration || 0) * 60000);

  const availability = await checkTechnicianAvailability(
    technicianId,
    service.technician.timezone,
    start,
    end,
  );

  if (!availability.available) {
    throw new Error(availability.reason as string);
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
    const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
      where: { userId: userId },
    });
    andConditions.push({
      technicianId: technicianProfile.id,
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
      status: {
        not: "CANCELLED",
      },
    },
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      payment: true,
      review: true,
    },
  });

  return {
    bookings,
    meta: {
      page,
      limit,
      total: total,
      totalPages: Math.ceil(total / limit),
    },
  };
};


const getBookingByIdFromDb = async (userId: string, bookingId: string) => {
  const user = await getMyProfileFromDb(userId);

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: {
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

  if (!bookingId) {
    throw new Error("Missing required path parameter: bookingId is undefined.");
  }

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
  });

  return cancelled;
};

const getAllBookings = async (userId: string, query: IBookingQuery) => {
  const user = await getMyProfileFromDb(userId);

  if (user.role !== "ADMIN") {
    throw new Error("Access denied: Admin role required");
  }

  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "scheduledStart";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: BookingWhereInput[] = [];

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
      payment: true,
      review: true,
    },
  });

  return {
    data: bookings,
    meta: {
      page,
      limit,
      total: total,
      totalPages: Math.ceil(total / limit),
    },
  };
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

  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId: userId },
  });
  if (booking.technicianId !== technicianProfile.id) {
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
      payment: true,
      review: true,
    },
  });

  return updated;
};

export const bookingService = {
  createBookingIntoDb,
  checkAvailabilityFromDb,
  getAllBookings,
  getMyBookingsFromDb,
  getBookingByIdFromDb,
  cancelBookingIntoDb,
  updateBookingStatusIntoDb,
};
