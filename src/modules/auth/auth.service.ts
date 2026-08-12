import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwtUtils";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import config from "../../config";
import { activeStatus, Prisma, VarifiedStatus } from "../../../generated/prisma/client";
import { IUser, IAuthUserQuery, RegisterUserPayload } from "./auth.interface";

const createUserIntoDB = async (payload: RegisterUserPayload) => {
  const {
    name,
    email,
    password,
    phone,
    role,
    profilePhoto,
    bio,
    yearsExperience,
    hourlyRate,
  } = payload;

  if (payload.role !== "CUSTOMER" && payload.role !== "TECHNICIAN") {
    throw new Error("Role must be either CUSTOMER or TECHNICIAN");
  }

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new Error("User with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      ...(payload.role === "TECHNICIAN" && {
        profile: {
          create: {
            profilePhoto,
            bio,
            yearsExperience: yearsExperience ?? 0,
            hourlyRate: hourlyRate ?? 0,
          },
        },
      }),
    },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: createdUser.id,
    },
    omit: {
      password: true,
    },
    include: {
      profile: true,
    },
  });

  return user;
};

const loginUserIntoDB = async (payload: IUser) => {
  const { email, password } = payload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });

  if (user.activeStatus === "BLOCKED") {
    throw new Error("Your account has been blocked! Contact with support.");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new Error("Password does not matched! Try again.");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_secret as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_secret as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const adminLogin = async (payload: IUser) => {
  const adminEmail = config.admin_email;
  const adminPassword = config.admin_password;

  if (!adminEmail || !adminPassword) {
    throw new Error("Admin credentials not configured");
  }

  if (payload.email !== adminEmail || payload.password !== adminPassword) {
    throw new Error("Invalid admin credentials");
  }

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
      activeStatus: true,
    },
  });

  if (!admin) {
    throw new Error("Invalid admin credentials");
  }

  const match = await bcrypt.compare(adminPassword, admin.password);
  if (!match) {
    throw new Error("Invalid admin credentials");
  }

  if (admin.role !== "ADMIN") {
    throw new Error("Invalid admin credentials");
  }

  if (admin.activeStatus === "BLOCKED" || !admin.activeStatus) {
    throw new Error("Admin account is blocked or inactive");
  }

  const jwtPayload = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_secret as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_secret as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  };
};

const getAllUsers = async (userId: string, query: IAuthUserQuery) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });
  if (user.role !== "ADMIN") {
    throw new Error("Access denied. Only admin can access all users");
  }

  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ?? "createdAt";
  const sortOrder = query.sortOrder ?? "desc";

  const andConditions: Prisma.UserWhereInput[] = [];

  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (query.role) {
    andConditions.push({
      role: query.role,
    });
  }

  if (query.activeStatus) {
    andConditions.push({
      activeStatus: query.activeStatus,
    });
  }

  const total = await prisma.user.count({
    where: {
      AND: andConditions,
    },
  });

  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  } as Prisma.UserOrderByWithRelationInput;

  const users = await prisma.user.findMany({
    where: {
      AND: andConditions,
    },
    include: {
      profile: true,
    },
    omit: {
      password: true,
    },
    take: limit,
    skip,
    orderBy,
  });

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const refreshToken = async (refreshToken: string) => {
  const verifiedRefreshToken = jwtUtils.verifiedToken(
    refreshToken,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success) {
    throw new Error(verifiedRefreshToken.error);
  }
  const { id } = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
  });

  if (user.activeStatus === "BLOCKED") {
    throw new Error("The user is blocked! Contact with support team.");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_secret as SignOptions,
  );

  return { accessToken };
};

const toggleUserStatus = async (adminId: string, userId: string, status: activeStatus) => {
  const admin = await prisma.user.findUniqueOrThrow({
    where: { id: adminId },
  });

  if (admin.role !== "ADMIN") {
    throw new Error("Access denied. Only admins can modify user accounts.");
  }

  if (adminId === userId) {
    throw new Error("Operation failed: You cannot modify your own status.");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      activeStatus: status,
    },
    omit: {
      password: true
    },
  });

  return updatedUser;
};

const verifyTechnician = async (adminId: string, technicianId: string, isVerified: VarifiedStatus) => {
  const admin = await prisma.user.findUniqueOrThrow({
    where: {
      id: adminId
    },
  });

  if (admin.role !== "ADMIN") {
    throw new Error("Access denied. Only admins can verify technicians.");
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: {
      id: technicianId,
    },
    data: {
      isVarified: isVerified,
    },
    include: {
      user: {
        omit: {
          password: true
        },
      },
    },
  });

  return updatedProfile;
};

export const authService = {
  createUserIntoDB,
  loginUserIntoDB,
  adminLogin,
  getAllUsers,
  refreshToken,
  toggleUserStatus,
  verifyTechnician,
};
