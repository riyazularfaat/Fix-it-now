import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { JwtPayload } from "jsonwebtoken";
import { ICreateReviewPayload, ICustomerBookingsQuery, IUpdatePassword } from "./customer.interface";
import { BookingWhereInput, PaymentWhereInput } from "../../../generated/prisma/models";

const getMyProfileFromDb = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
  });

  if (user.role !== "CUSTOMER") {
    throw new Error("Access denied: Customer role required");
  }

  return user;
};

const getAllTechnicianFromDB = async () => {
  const users = await prisma.user.findMany({
    where: {
      role: "TECHNICIAN",
      activeStatus: "ACTIVE",
    },
    include: {
      profile: true,
    },
    omit: {
      password: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return users;
};


const updateMyProfileInDb = async (userId: string, payload: JwtPayload) => {
  await getMyProfileFromDb(userId);
  const { name, email, phone } = payload;


  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      phone: phone ?? null,
    },
    omit: { password: true },
  });

  return updatedUser;
};

const updatePassword = async (userId: string, data: IUpdatePassword)=> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }
  if (user.role !== "CUSTOMER") {
    throw new Error("Access denied: Customer role required");
  }

  const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  const newPassword = await bcrypt.hash(
    data.newPassword, Number(config.bcrypt_salt_rounds),
  );

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      password: newPassword
    },
    omit: {
      password: true
    },
  });

  return updated;
};

const deactivateMyAccount = async (userId: string, password: string) => {
  await getMyProfileFromDb(userId);

  const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
  
  const isPasswordValid = await bcrypt.compare(password, hashedPassword);
  if (!isPasswordValid) {
    throw new Error("Password is incorrect");
  }

  const deactivated = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      activeStatus: "INACTIVE",
    },
    omit: {
      password: true,
    },
  });

  return deactivated;
};

const createReviewIntoDb = async (userId: string, payload: ICreateReviewPayload) => {
  
  await getMyProfileFromDb(userId);

  const { bookingId, rating, comment } = payload;

  if (rating < 1 || rating > 5) {
    throw new Error(
      "Validation Error: Rating must be an integer between 1 and 5.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: {
        id: bookingId
      },
    });

    if (!booking)
    {
      throw new Error("Booking record not found.");
    }
    if (booking.customerId !== userId)
    {
      throw new Error("Access denied: You can only review your own bookings.");
    }
    if (booking.status !== "COMPLETED")
    {
      throw new Error(
        "Operation failed: You can only review a technician after the booking is COMPLETED.",
      );
    }

    const existingReview = await tx.review.findUnique({
      where: {
        bookingId
      },
    });
    if (existingReview) {
      throw new Error(
        "Conflict: You have already submitted a review for this booking.",
      );
    }

    const newReview = await tx.review.create({
      data: {
        bookingId,
        customerId: userId,
        technicianId: booking.technicianId, 
        rating,
        comment: comment ?? null,
      },
      include: {
        technician: true
      },
    });

    return newReview;
  });

  return result;
};

const getMyBookings = async (userId: string, query: ICustomerBookingsQuery) => {
  await getMyProfileFromDb(userId); 
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "scheduledStart";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: BookingWhereInput[] = [];

  if(query.serviceId) {
    andConditions.push({
      serviceId: query.serviceId
    });
  }

  if (query.technicianId) {
    andConditions.push({
      technicianId: query.technicianId
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status
    });
  }

  if (query.scheduledStart) {
    andConditions.push({
      scheduledStart: {
        gte: new Date(query.scheduledStart)
      }
    });
  }

  if (query.scheduledEnd) {
    andConditions.push({
      scheduledEnd: { lte: new Date(query.scheduledEnd) }
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
      meta: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
  return bookings;
};


export const customerService = {
  getAllTechnicianFromDB,
  getMyProfileFromDb,
  updateMyProfileInDb,
  updatePassword,
  deactivateMyAccount,
  getMyBookings,
  createReviewIntoDb
};
