import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { HttpError, handle, json } from "@/lib/http";
import { passwordSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  return handle(async () => {
    const session = await requireUser(request);
    if (session.isDemo) {
      throw new HttpError(403, "The demo account password cannot be changed.");
    }
    const data = passwordSchema.parse(await request.json());

    const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
    if (!user || !(await verifyPassword(data.currentPassword, user.passwordHash))) {
      throw new HttpError(400, "Your current password is incorrect.");
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(data.newPassword), updatedAt: new Date() })
      .where(eq(users.id, session.id));

    return json({ ok: true });
  });
}
