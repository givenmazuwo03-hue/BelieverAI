import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const clerkUserId = session.metadata?.clerkUserId;

    if (clerkUserId) {
      const client = await clerkClient();
      const user = await client.users.getUser(clerkUserId);
      await client.users.updateUserMetadata(clerkUserId, {
        publicMetadata: {
          ...user.publicMetadata,
          plan: "pro",
          stripeCustomerId: session.customer,
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const client = await clerkClient();
    const users = await client.users.getUserList({
      query: subscription.customer,
    });
    // Fallback: search by stripeCustomerId in metadata if needed
  }

  return NextResponse.json({ received: true });
}
