import { Stripe } from "stripe";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe"; // Your existing Stripe singleton
import {
    PaymentStatus,
    PaymentProvider,
} from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/browser";
import { handleCheckoutCompleted } from "./payment.utils";


const createCheckoutSession = async (userId: string, bookingId: string) => {
    return await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUniqueOrThrow({
            where: { id: bookingId },
            include: {
                customer: true,
                service: {
                    select: {
                        stripePriceId: true,
                        currency: true,
                        title: true,
                        description: true,
                    },
                },
            },
        });

        if (booking.customerId !== userId) {
            throw new Error("Unauthorized: You don't own this booking");
        }

        if (booking.status !== "ACCEPTED") {
            throw new Error(
                `Booking must be in ACCEPTED state for payment. Current state: ${booking.status}`,
            );
        }

        if (!booking.service.stripePriceId) {
            throw new Error(
                `Service "${booking.service.title}" is not configured for online payments.Contact technician to enable Stripe pricing.`,
            );
        }


        let stripeCustomerId = booking.customer.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: booking.customer.email,
                name: booking.customer.name,
                metadata: {
                    userId: userId,
                    bookingId: booking.id,
                },
            });

            stripeCustomerId = customer.id;

            await tx.user.update({
                where: { id: userId },
                data: { stripeCustomerId },
            });
        }

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: booking.service.stripePriceId,
                    quantity: 1,
                },
            ],
            mode: "payment",
            customer: stripeCustomerId,
            payment_method_types: ["card"],
            success_url: `${config.app_url}/booking/${bookingId}/payment?success=true`,
            cancel_url: `${config.app_url}/booking/${bookingId}/payment?success=false`,
            metadata: {
                bookingId: booking.id,
                userId: userId,
                serviceId: booking.serviceId,
            },
        });

        await tx.payment.create({
          data: {
            bookingId,
            provider: PaymentProvider.STRIPE,
            providerPaymentId: session.id,
            amount: new Prisma.Decimal(booking.totalAmount), 
            currency: booking.currency,
            status: PaymentStatus.PENDING,
            metadata: {
              stripe_session_id: session.id,
              stripe_price_id: booking.service.stripePriceId,
              service_title: booking.service.title,
              service_description: booking.service.description,
            },
          },
        });

        return {
            checkoutUrl: session.url,
            sessionId: session.id,
        };
    });
};


const handleWebhook = async (payload: Buffer, signature: string) => {
    const endpointSecret = config.stripe_webhook_secret;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            payload,
            signature,
            endpointSecret,
        );
    } catch (err: any) {
        console.error(
            `Webhook signature verification failed: ${err.message}`,
        );
        throw err;
    }

    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object;
            await handleCheckoutCompleted(session);
            break;

        default:
            console.log(`Unhandled Stripe event: ${event.type}`);
    }
};



export const paymentService = {
    createCheckoutSession,
    handleWebhook,
};
