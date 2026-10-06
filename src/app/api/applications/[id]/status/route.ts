import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { statusUpdateSchema } from "@/lib/validation";
import { updateApplicationStatus } from "@/server/applications";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    const { status } = statusUpdateSchema.parse(await request.json());
    return json(await updateApplicationStatus(user.id, id, status));
  });
}
