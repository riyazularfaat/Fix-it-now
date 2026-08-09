import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import {
  IAvailabilityException,
  IAvailabilitySlot,
  ITechnicianBookingsQuery,
  ITechnicianPaymentsQuery,
  ITechnicianReviewsQuery,
  IUpdatePassword,
  IUpdateTechnician,
} from "./technician.interface";
import { activeStatus, Prisma } from "../../../generated/prisma/browser";
import bcrypt from "bcryptjs";
import config from "../../config";
import {
  BookingWhereInput,
  PaymentWhereInput,
  ReviewWhereInput,
} from "../../../generated/prisma/models";

const getMyProfileFromDb = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
  });

  if (user.role !== "TECHNICIAN") {
    throw new Error("Access denied: Technician role required");
  }

  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: {
      userId: userId,
    },
  });

  return {
    ...user,
    ...technicianProfile,
  };
};

const getAllTechniciansFromDB = async () => {
  const technicians = await prisma.user.findMany({
    where: {
      role: "TECHNICIAN",
    },
    omit: {
      password: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return technicians;
};

const updateMyProfileInDb = async (
  userId: string,
  payload: IUpdateTechnician,
) => {
  await getMyProfileFromDb(userId);

  const { name, email, phone, bio, yearsExperience, hourlyRate, profilePhoto } =
    payload;

  const userData: Prisma.UserUpdateInput = {};
  if (name !== undefined) userData.name = name;
  if (email !== undefined) userData.email = email;
  if (phone !== undefined) userData.phone = phone;

  const techData: Prisma.TechnicianProfileUpdateInput = {};
  if (bio !== undefined) techData.bio = bio;
  if (yearsExperience !== undefined) techData.yearsExperience = yearsExperience;
  if (hourlyRate !== undefined) techData.hourlyRate = hourlyRate;
  if (profilePhoto !== undefined) techData.profilePhoto = profilePhoto;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: userData,
      omit: { password: true },
    }),
    prisma.technicianProfile.update({
      where: { userId: userId },
      data: techData,
    }),
  ]);
  const updatedTechnician = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    omit: {
      password: true,
    },
    include: {
      profile: true,
    },
  });

  return updatedTechnician;
};

const updatePassword = async (userId: string, data: IUpdatePassword) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }
  if (user.role !== "TECHNICIAN") {
    throw new Error("Access denied: Technician role required");
  }

  const isPasswordValid = await bcrypt.compare(
    data.currentPassword,
    user.password,
  );
  if (!isPasswordValid) {
    throw new Error("Invalid password!");
  }

  const newPassword = await bcrypt.hash(
    data.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      password: newPassword,
    },
    omit: {
      password: true,
    },
  });

  return updated;
};

const deactivateMyAccount = async (userId: string) => {
  await getMyProfileFromDb(userId);

  const deactivated = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      activeStatus: activeStatus.INACTIVE,
    },
    omit: {
      password: true,
    },
  });

  return deactivated;
};

const getMyBookings = async (
  userId: string,
  query: ITechnicianBookingsQuery,
) => {
  await getMyProfileFromDb(userId);
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "scheduledStart";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: BookingWhereInput[] = [];

  andConditions.push({
    technicianId: userId,
  });

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
      customer: true,
      omit: {
        password: true,
      },
    },
  });

  return bookings;
};

const getMyPayments = async (
  userId: string,
  query: ITechnicianPaymentsQuery,
) => {
  await getMyProfileFromDb(userId);
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: PaymentWhereInput[] = [];

  andConditions.push({
    booking: {
      technicianId: userId,
    },
  });

  if (query.provider) {
    andConditions.push({
      provider: query.provider,
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status,
    });
  }

  let total = await prisma.payment.count({
    where: {
      AND: andConditions,
    },
  });
  const payments = await prisma.payment.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      booking: {
        include: {
          customer: true,
          omit: {
            password: true,
          },
        },
      },
    },
  });

  return payments;
};

const getMyReviewsReceived = async (
  userId: string,
  query: ITechnicianReviewsQuery,
) => {
  await getMyProfileFromDb(userId);
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: ReviewWhereInput[] = [];

  andConditions.push({
    technicianId: userId,
  });

  if (query.rating !== undefined) {
    andConditions.push({
      rating: query.rating,
    });
  }

  if (query.isPublic !== undefined) {
    andConditions.push({
      isPublic: query.isPublic,
    });
  }

  let total = await prisma.review.count({
    where: {
      AND: andConditions,
    },
  });
  const reviews = await prisma.review.findMany({
    where: {
      AND: andConditions,
    },
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      booking: {
        include: {
          customer: {
            omit: {
              password: true,
            },
          },
        },
      },
    },
  });

  return reviews;
};
const getTechnicianAvailabilityFromDb = async (technicianId: string) => {
  await prisma.technicianProfile.findUniqueOrThrow({
    where: { id: technicianId },
  });

  const availability = await prisma.availability.findMany({
    where: {
      technicianId,
    },
    orderBy: [
      {
        dayOfWeek: "asc",
      },
      { startTime: "asc" },
    ],
  });

  return availability;
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDate = (dateStr: string) => {
  if (typeof dateStr !== "string" || !DATE_REGEX.test(dateStr)) {
    throw new Error(
      `date must be in "YYYY-MM-DD" format, received: ${dateStr}`,
    );
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`"${dateStr}" is not a valid calendar date`);
  }

  return date;
};

const getTechnicianAvailabilityExceptionsFromDb = async (
  technicianId: string,
) => {
  await prisma.technicianProfile.findUniqueOrThrow({
    where: { id: technicianId },
  });

  const exceptions = await prisma.availabilityException.findMany({
    where: {
      technicianId,
      date: { gte: normalizeDate(new Date().toISOString().slice(0, 10)) },
    },
    orderBy: { date: "asc" },
  });

  return exceptions;
};

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const validateTimeRange = (startTime: string, endTime: string) => {
  if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
    throw new Error("startTime and endTime must be in HH:mm format");
  }

  if (startTime >= endTime) {
    throw new Error("startTime must be before endTime");
  }
};

const validateAvailabilitySlot = (slot: IAvailabilitySlot) => {
  if (
    typeof slot.dayOfWeek !== "number" ||
    !Number.isInteger(slot.dayOfWeek) ||
    slot.dayOfWeek < 0 ||
    slot.dayOfWeek > 6
  ) {
    throw new Error(
      "dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)",
    );
  }

  validateTimeRange(slot.startTime, slot.endTime);
};

const hasOverlap = (
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
) => {
  return a.startTime < b.endTime && b.startTime < a.endTime;
};

const setMyAvailabilityInDb = async (
  userId: string,
  slots: IAvailabilitySlot[],
) => {
  await getMyProfileFromDb(userId);

  if (!slots || slots.length === 0) {
    throw new Error("At least one availability slot is required");
  }

  slots.forEach(validateAvailabilitySlot);

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (
        slots[i].dayOfWeek === slots[j].dayOfWeek &&
        hasOverlap(slots[i], slots[j])
      ) {
        throw new Error(
          `Overlapping availability slots on day ${slots[i].dayOfWeek}`,
        );
      }
    }
  }
  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId },
  });

  await prisma.$transaction([
    prisma.availability.deleteMany({
      where: { technicianId: technicianProfile.id },
    }),
    prisma.availability.createMany({
      data: slots.map((slot) => ({
        technicianId: technicianProfile.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
      skipDuplicates: true,
    }),
  ]);

  const updatedAvailability = await prisma.availability.findMany({
    where: { technicianId: technicianProfile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return updatedAvailability;
};

const updateMyAvailabilityInDb = async (
  userId: string,
  slotId: string,
  payload: Partial<IAvailabilitySlot>,
) => {
  await getMyProfileFromDb(userId);

  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId },
  });

  const existingSlot = await prisma.availability.findUniqueOrThrow({
    where: { id: slotId },
  });

  if (existingSlot.technicianId !== technicianProfile.id) {
    throw new Error(
      "Access denied: This availability slot does not belong to you",
    );
  }

  const { dayOfWeek, startTime, endTime } = payload;

  const slotData: Prisma.AvailabilityUpdateInput = {};
  if (dayOfWeek !== undefined) slotData.dayOfWeek = dayOfWeek;
  if (startTime !== undefined) slotData.startTime = startTime;
  if (endTime !== undefined) slotData.endTime = endTime;

  const merged: IAvailabilitySlot = {
    dayOfWeek: dayOfWeek ?? existingSlot.dayOfWeek,
    startTime: startTime ?? existingSlot.startTime,
    endTime: endTime ?? existingSlot.endTime,
  };

  validateAvailabilitySlot(merged);

  const otherSlots = await prisma.availability.findMany({
    where: {
      technicianId: technicianProfile.id,
      dayOfWeek: merged.dayOfWeek,
      id: { not: slotId },
    },
  });

  if (otherSlots.some((slot) => hasOverlap(merged, slot))) {
    throw new Error(
      `Updated slot overlaps with an existing slot on day ${merged.dayOfWeek}`,
    );
  }

  const updatedSlot = await prisma.availability.update({
    where: { id: slotId },
    data: slotData,
  });

  return updatedSlot;
};

const setAvailabilityExceptionInDb = async (
  userId: string,
  payload: IAvailabilityException,
) => {
  await getMyProfileFromDb(userId);

  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId },
  });

  const result = await prisma.availabilityException.create({
    data: {
      technicianId: technicianProfile.id,
      date: normalizeDate(payload.date),
      isAvailable: payload.isAvailable,
      startTime: payload.isAvailable ? payload.startTime : null,
      endTime: payload.isAvailable ? payload.endTime : null,
      reason: payload.reason ?? null,
    },
  });

  return result;
};

const updateAvailabilityExceptionInDb = async (
  userId: string,
  exceptionId: string,
  payload: Partial<IAvailabilityException>,
) => {
  await getMyProfileFromDb(userId);

  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId },
  });

  const exception = await prisma.availabilityException.findUniqueOrThrow({
    where: { id: exceptionId },
  });

  if (exception.technicianId !== technicianProfile.id) {
    throw new Error(
      "Access denied: This availability exception does not belong to you",
    );
  }

  const { date, isAvailable, startTime, endTime, reason } = payload;
  const updatedData: Prisma.AvailabilityExceptionUpdateInput = {};

  if (date !== undefined) {
    updatedData.date = normalizeDate(date);
  }

  if (isAvailable !== undefined) {
    updatedData.isAvailable = isAvailable;
  }

  if (isAvailable !== undefined && isAvailable) {
    if (!startTime || !endTime) {
      throw new Error(
        "startTime and endTime are required when isAvailable is true",
      );
    }
    validateTimeRange(startTime, endTime);
    updatedData.startTime = startTime;
    updatedData.endTime = endTime;
  }

  if (isAvailable !== undefined && !isAvailable) {
    updatedData.startTime = null;
    updatedData.endTime = null;
  }

  if (reason !== undefined) {
    updatedData.reason = reason;
  }

  const updatedException = await prisma.availabilityException.update({
    where: {
      id: exception.id,
    },
    data: updatedData,
  });

  return updatedException;
};

const deleteAvailabilityExceptionFromDb = async (
  userId: string,
  exceptionId: string,
) => {
  await getMyProfileFromDb(userId);

  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId },
  });

  if (userId !== technicianProfile.userId) {
    throw new Error("Access denied: This availability exception does not belong to you");
  }

  const deleted = await prisma.availabilityException.delete({
    where: {
      id: exceptionId,
    },
  });

  return deleted;
};


const getMyAvailabilityExceptionsFromDb = async (userId: string) => {
  await getMyProfileFromDb(userId);

  const technicianProfile = await prisma.technicianProfile.findUniqueOrThrow({
    where: { userId },
  });

  const exceptions = await prisma.availabilityException.findMany({
    where: {
      technicianId: technicianProfile.id,
      date: { gte: normalizeDate(new Date().toISOString().slice(0, 10)) },
    },
    orderBy: { date: "asc" },
  });

  return exceptions;
};

export const technicianService = {
  getMyProfileFromDb,
  getAllTechniciansFromDB,
  updateMyProfileInDb,
  updatePassword,
  deactivateMyAccount,
  getMyBookings,
  getMyPayments,
  getMyReviewsReceived,
  getTechnicianAvailabilityFromDb,
  getTechnicianAvailabilityExceptionsFromDb,
  setMyAvailabilityInDb,
  updateMyAvailabilityInDb,
  setAvailabilityExceptionInDb,
  getMyAvailabilityExceptionsFromDb,
  updateAvailabilityExceptionInDb,
  deleteAvailabilityExceptionFromDb,
};
