import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { RegisterUserPayload } from "./user.interface";
import config from "../../config";

const createUserIntoDB = async (payload: RegisterUserPayload) => {
  const {
    name,
    email,
    password,
    phone,
    profilePhoto,
    bio,
    yearsExperience,
    hourlyRate,
  } = payload;
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
      profile: {
        create: {
          profilePhoto,
          bio,
          yearsExperience: yearsExperience ?? 0,
          hourlyRate: hourlyRate ?? 0,
        },
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: createdUser.id,
      email: createdUser.email,
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

export const userService = {
  createUserIntoDB,
};
