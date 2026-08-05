import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { ITechnicianBookingsQuery, ITechnicianPaymentsQuery, ITechnicianReviewsQuery, IUpdatePassword, IUpdateTechnician } from "./technician.interface";
import { activeStatus, Prisma } from "../../../generated/prisma/browser";
import bcrypt from "bcryptjs";
import config from "../../config";
import { BookingWhereInput, PaymentWhereInput, ReviewWhereInput } from "../../../generated/prisma/models";

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

const updateMyProfileInDb = async (userId: string, payload: IUpdateTechnician) => {
  await getMyProfileFromDb(userId);

  const { name, email, phone, bio, yearsExperience, hourlyRate, profilePhoto } = payload;

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
      activeStatus: activeStatus.INACTIVE
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


export const technicianService = {
  getMyProfileFromDb,
  getAllTechniciansFromDB,
  updateMyProfileInDb,
  updatePassword,
  deactivateMyAccount,
  getMyBookings,
  getMyPayments,
  getMyReviewsReceived,
};