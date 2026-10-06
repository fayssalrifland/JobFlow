import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { applicationFormSchema, applicationQuerySchema } from "@/lib/validation";
import { createApplication, listApplications } from "@/server/applications";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const query = applicationQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
    return json(await listApplications(user.id, query));
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const values = applicationFormSchema.parse(await request.json());
    return json(await createApplication(user.id, values), 201);
  });
}

export const dynamic = "force-dynamic";
