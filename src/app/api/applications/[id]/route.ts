import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { applicationFormSchema } from "@/lib/validation";
import { deleteApplication, getApplicationDetail, updateApplication } from "@/server/applications";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    return json(await getApplicationDetail(user.id, id));
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    const values = applicationFormSchema.parse(await request.json());
    return json(await updateApplication(user.id, id, values));
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    return json(await deleteApplication(user.id, id));
  });
}
