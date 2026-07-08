import { NextFunction, Request, Response } from "express";

export const notFoundError = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(404).json({
    success: false,
    message: "Route not found!",
    path: req.originalUrl,
    Time: Date(),
  });
};
