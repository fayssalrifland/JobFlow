import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { publicUser, requireUser } from "@/lib/auth";
import { HttpError, handle, json } from "@/lib/http";
import { preferencesSchema, profileSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    return json({ user });
  });
}

const patchSchema = profileSchema.partial().and(preferencesSchema);

export async function PATCH(request: Request) {
  return handle(async () => {
    const session = await requireUser(request);
    const data = patchSchema.parse(await request.json());

    if (data.email) {
      const email = data.email.toLowerCase();
      const [conflict] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, session.id)))
        .limit(1);
      if (conflict) throw new HttpError(409, "That email is already in use.");
    }

    const [updated] = await db
      .update(users)
      .set({
        ...(data.name ? { name: data.name } : {}),
        ...(data.email ? { email: data.email.toLowerCase() } : {}),
        ...(data.headline !== undefined ? { headline: data.headline || null } : {}),
        ...(data.theme ? { theme: data.theme } : {}),
        ...(data.defaultCurrency ? { defaultCurrency: data.defaultCurrency } : {}),
        ...(data.defaultView ? { defaultView: data.defaultView } : {}),
        ...(data.emailReminders !== undefined ? { emailReminders: data.emailReminders } : {}),
        ...(data.inAppNotifications !== undefined
          ? { inAppNotifications: data.inAppNotifications }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.id))
      .returning();

    return json({ user: publicUser(updated) });
  });
}

export const dynamic = "force-dynamic";
