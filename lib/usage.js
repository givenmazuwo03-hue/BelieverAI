import { clerkClient } from "@clerk/nextjs/server";

const FREE_DAILY_LIMIT = 5;

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export async function checkAndUseCredit(userId) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.publicMetadata || {};

  if (meta.plan === "pro") {
    return { allowed: true, plan: "pro" };
  }

  const today = todayString();
  const usageDate = meta.usageDate;
  const usageCount = usageDate === today ? meta.usageCount || 0 : 0;

  if (usageCount >= FREE_DAILY_LIMIT) {
    return {
      allowed: false,
      plan: "free",
      remaining: 0,
      limit: FREE_DAILY_LIMIT,
    };
  }

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...meta,
      usageDate: today,
      usageCount: usageCount + 1,
    },
  });

  return {
    allowed: true,
    plan: "free",
    remaining: FREE_DAILY_LIMIT - (usageCount + 1),
    limit: FREE_DAILY_LIMIT,
  };
}
