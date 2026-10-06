import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cvs } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, errorResponse, handle, json } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

/** Streams the stored CV file back to the browser for preview/download. */
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const [cv] = await db
      .select()
      .from(cvs)
      .where(and(eq(cvs.id, id), eq(cvs.userId, user.id)))
      .limit(1);
    if (!cv) throw new HttpError(404, "CV not found");
    if (!cv.fileData) throw new HttpError(404, "This CV has no uploaded file");

    const download = new URL(request.url).searchParams.get("download") === "1";
    const buffer = Buffer.from(cv.fileData, "base64");
    const body = new Uint8Array(buffer);
    return new Response(body, {
      headers: {
        "Content-Type": cv.fileType || "application/pdf",
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${(cv.fileName || "cv.pdf").replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    const [existing] = await db
      .select({ id: cvs.id })
      .from(cvs)
      .where(and(eq(cvs.id, id), eq(cvs.userId, user.id)))
      .limit(1);
    if (!existing) throw new HttpError(404, "CV not found");
    await db.delete(cvs).where(eq(cvs.id, id));
    return json({ id });
  });
}
