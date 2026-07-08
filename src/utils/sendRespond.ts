import { Response } from "express";
import { TSendData } from "../interfaces";

export const sendResponse = <T>(res: Response, data: TSendData<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
    meta: data.meta,
  });
};
