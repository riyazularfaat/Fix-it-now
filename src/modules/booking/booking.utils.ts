import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";

export const handlePaymentCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const { bookingId, userId } = session.metadata;
  const stripePaymentId = session.payment_intent as string;
  const amountTotal = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";

  if (!bookingId || !userId || !stripePaymentId) {
    console.log("Webhook : Missing values For Completed Payment Session");
    return;
  }

  // Verify payment was successful
  if (session.payment_status !== "paid") {
    console.log(`Webhook : Payment not successful for session ${session.id}`);
    return;
  }

  // Update booking status to PAID and save payment details
  await prisma.$transaction(async (tx) => {
    // Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "PAID",
        // Store payment reference if needed
        // stripePaymentId: stripePaymentId, // Only if you added this field to Booking model
      },
    });

    // Create payment record
    await tx.payment.create({
      data: {
        bookingId,
        amount: amountTotal / 100, // Convert from cents to dollars
        currency: currency.toUpperCase(),
        provider: "STRIPE",
        stripePaymentId,
        status: "COMPLETED",
        // Add other relevant fields from your Payment model
        stripeClientSecret: session.client_secret || null,
      },
    });
  });
};
