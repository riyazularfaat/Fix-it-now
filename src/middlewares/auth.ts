import { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/enums.js";
import { catchAsync } from "../utils/catchAsync.js";
import config from "../config/index.js";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import httpStatus from "http-status";
import { jwtUtils } from "../utils/jwtUtils.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    }
  }
}

export const auth = (...requiredRole: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization?.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new Error(
        "You are not logged in! Please login to access this resource.",
      );
    }

    const verifiedToken = jwtUtils.verifiedToken(
      token,
      config.jwt_access_secret,
    );

    if (!verifiedToken.success) {
      throw new Error(verifiedToken.error);
    }

    const { id, name, email, password, role } =
      verifiedToken.data as JwtPayload;
    if (!requiredRole.includes(role)) {
      res.status(httpStatus.FORBIDDEN).json({
        success: false,
        statusCode: httpStatus.FORBIDDEN,
        message:
          "Forbidden! You don't have permission to access this resource.",
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        id,
        name,
        email,
        role,
      },
    });

    if (!user) {
      throw new Error("User not found! You aren't logged in yet.");
    }
    if (user.activeStatus === "BLOCKED") {
      throw new Error("Your account has been blocked! Contact with support.");
    }

    req.user = {
      id,
      name,
      email,
      role,
    };

    next();
  });
};
