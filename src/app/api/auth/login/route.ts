import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, publicUser, setSessionCookie, verifyPassword } from "@/lib/auth";
import { HttpError, clientKey, handle, json, rateLimit } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(clientKey(request, "login"), 10, 60_000);
    const data = loginSchema.parse(await request.json());
    const email = data.email.toLowerCase();

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      throw new HttpError(401, "Incorrect email or password.");
    }

    await setSessionCookie(user.id);
    return json({ user: publicUser(user), token: await createSessionToken(user.id) });
  });
}
