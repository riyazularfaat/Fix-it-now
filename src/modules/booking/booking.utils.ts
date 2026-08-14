import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";

export const handlePaymentCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const bookingId = session.metadata?.bookingId;
  const userId = session.metadata?.userId;
  const stripePaymentId = session.payment_intent as string;
  const amountTotal = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";

  if (!bookingId || !userId || !stripePaymentId) {
    console.log("Webhook : Missing values For Completed Payment Session");
    return;
  }


  if (session.payment_status !== "paid") {
    console.log(`Webhook : Payment not successful for session ${session.id}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "PAID",
      },
    });


    await tx.payment.create({
      data: {
        bookingId,
        amount: amountTotal / 100,
        currency: currency.toUpperCase(),
        provider: "STRIPE",
        providerPaymentId: stripePaymentId,
        status: "COMPLETED",
        stripeClientSecret: session.client_secret || null,
      },
    });
  });
};
