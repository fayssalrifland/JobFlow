import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, handle, json } from "@/lib/http";
import { activityFormSchema } from "@/lib/validation";
import { logActivity } from "@/server/activity";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    const [application] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, user.id)))
      .limit(1);
    if (!application) throw new HttpError(404, "Application not found");

    const data = activityFormSchema.parse(await request.json());
    const activity = await logActivity({
      userId: user.id,
      applicationId: id,
      type: "CUSTOM_EVENT",
      message: data.message,
      occurredAt: data.occurredAt ? new Date(`${data.occurredAt}T12:00:00`) : new Date(),
    });
    return json(activity, 201);
  });
}
