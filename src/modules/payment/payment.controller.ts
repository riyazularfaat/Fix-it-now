import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { paymentService } from "./payment.service.js";
import { sendResponse } from "../../utils/sendRespond.js";

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const bookingId  = req.params.bookingId;
    const userId = req.user?.id;

    if (!userId) {
      throw new Error("Authentication required");
    }

    const result = await paymentService.createCheckoutSession(
      userId as string,
      bookingId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Payment checkout created successfully",
      data: result,
    });
  },
);

const webhookHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body as Buffer;
    const signature = req.headers["stripe-signature"] as string;

    await paymentService.handleWebhook(payload, signature);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Webhook processed successfully",
      data: null,
    });
  },
);

export const paymentController = {
  createCheckoutSession,
  webhookHandler,
};
