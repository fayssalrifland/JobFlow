import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, hashPassword, publicUser, setSessionCookie } from "@/lib/auth";
import { HttpError, clientKey, handle, json, rateLimit } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { logActivity, notify } from "@/server/activity";

export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(clientKey(request, "register"), 8, 60_000);
    const body = await request.json();
    const data = registerSchema.parse(body);
    const email = data.email.toLowerCase();

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) throw new HttpError(409, "An account with that email already exists.");

    const [created] = await db
      .insert(users)
      .values({ email, name: data.name, passwordHash: await hashPassword(data.password) })
      .returning();

    await notify({
      userId: created.id,
      type: "SYSTEM",
      title: "Welcome to JobFlow",
      body: "Add your first application to start tracking your job search.",
      href: "/app/board",
    });
    await logActivity({
      userId: created.id,
      type: "CUSTOM_EVENT",
      message: "Account created",
    });

    await setSessionCookie(created.id);
    return json({ user: publicUser(created), token: await createSessionToken(created.id) }, 201);
  });
}
