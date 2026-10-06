import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, cvs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { cvFormSchema } from "@/lib/validation";
import type { CvDTO } from "@/types";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const rows = await db
      .select({
        cv: cvs,
        usageCount: sql<number>`count(${applications.id})::int`,
      })
      .from(cvs)
      .leftJoin(applications, eq(applications.cvId, cvs.id))
      .where(eq(cvs.userId, user.id))
      .groupBy(cvs.id)
      .orderBy(asc(cvs.createdAt));

    const items: CvDTO[] = rows.map(({ cv, usageCount }) => ({
      id: cv.id,
      name: cv.name,
      version: cv.version,
      notes: cv.notes,
      fileName: cv.fileName,
      fileType: cv.fileType,
      fileSize: cv.fileSize,
      hasFile: Boolean(cv.fileData),
      isDefault: cv.isDefault,
      createdAt: cv.createdAt.toISOString(),
      usageCount,
    }));

    return json({ items });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const data = cvFormSchema.parse(await request.json());

    if (data.isDefault) {
      await db.update(cvs).set({ isDefault: false }).where(eq(cvs.userId, user.id));
    }

    const [created] = await db
      .insert(cvs)
      .values({
        userId: user.id,
        name: data.name,
        version: data.version || null,
        notes: data.notes || null,
        fileName: data.fileName || null,
        fileType: data.fileType || null,
        fileSize: data.fileSize ?? null,
        fileData: data.fileData || null,
        isDefault: data.isDefault ?? false,
      })
      .returning();

    return json(
      {
        id: created.id,
        name: created.name,
        version: created.version,
        notes: created.notes,
        fileName: created.fileName,
        fileType: created.fileType,
        fileSize: created.fileSize,
        hasFile: Boolean(created.fileData),
        isDefault: created.isDefault,
        createdAt: created.createdAt.toISOString(),
        usageCount: 0,
      } satisfies CvDTO,
      201,
    );
  });
}

export const dynamic = "force-dynamic";
