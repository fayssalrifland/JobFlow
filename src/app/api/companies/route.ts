import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, companies } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { ensureCompany } from "@/server/applications";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const rows = await db
      .select({
        id: companies.id,
        name: companies.name,
        website: companies.website,
        industry: companies.industry,
        accent: companies.accent,
        applicationCount: sql<number>`count(${applications.id})::int`,
      })
      .from(companies)
      .leftJoin(applications, eq(applications.companyId, companies.id))
      .where(eq(companies.userId, user.id))
      .groupBy(companies.id)
      .orderBy(asc(companies.name));
    return json({ items: rows });
  });
}

const createSchema = z.object({ name: z.string().trim().min(1).max(120) });

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const data = createSchema.parse(await request.json());
    const company = await ensureCompany(user.id, data.name);
    return json(company, 201);
  });
}

export const dynamic = "force-dynamic";
