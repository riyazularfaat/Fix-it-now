import Stripe from "stripe";
import { PaymentStatus } from "../../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";

export const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const bookingId = session.metadata?.bookingId;
  const userId = session.metadata?.userId;

  if (!bookingId || !userId) {
    console.error("Missing metadata in completed checkout session");
    return;
  }

  if (session.payment_status !== "paid") {
    console.log(`Payment not successful for session ${session.id}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findUnique({
      where: {
        providerPaymentId: session.id,
      },
      select: {
        id: true,
        metadata: true,
      },
    });

    if (!existingPayment) {
      console.error(`Payment record not found for session ${session.id}`);
      return;
    }

    await tx.payment.updateMany({
      where: {
        providerPaymentId: session.id,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.COMPLETED,
        metadata: {
          ...(existingPayment.metadata !== null &&
          typeof existingPayment.metadata === "object" &&
          !Array.isArray(existingPayment.metadata)
            ? existingPayment.metadata
            : {}),
          stripe_payment_status: "paid",
          stripe_amount_total: session.amount_total,
          stripe_currency: session.currency,
        },
      },
    });

    await tx.booking.updateMany({
      where: {
        id: bookingId,
        status: "ACCEPTED",
      },
      data: {
        status: "PAID",
      },
    });

    console.log(
      `Payment succeeded for booking ${bookingId} via session ${session.id}`,
    );
  });
};
