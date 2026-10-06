"use client";

import { useState } from "react";
import { Download, Eye, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/feedback";
import { useCreateCv, useCvs, useDeleteCv } from "@/hooks/use-cvs";
import { formatDate } from "@/lib/utils";
import { withToken } from "@/services/api";

const MAX_BYTES = 4_000_000;

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

export default function DocumentsPage() {
  const { data, isLoading, isError, error, refetch } = useCvs();
  const create = useCreateCv();
  const remove = useDeleteCv();

  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", version: "", notes: "", isDefault: false });
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError("Give this CV a recognisable name.");
      return;
    }
    if (file && file.size > MAX_BYTES) {
      setFormError("PDF files must be smaller than 4 MB.");
      return;
    }
    setFormError(null);

    try {
      const fileData = file ? await readFileAsBase64(file) : undefined;
      await create.mutateAsync({
        name: form.name.trim(),
        version: form.version.trim() || undefined,
        notes: form.notes.trim() || undefined,
        isDefault: form.isDefault,
        fileName: file?.name,
        fileType: file?.type || "application/pdf",
        fileSize: file?.size,
        fileData,
      });
      setForm({ name: "", version: "", notes: "", isDefault: false });
      setFile(null);
      setOpen(false);
    } catch {
      toast.error("Upload failed. Try a smaller file.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Documents"
        description="Keep every CV version in one place and link it to the applications it was used for."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add CV
          </Button>
        }
      />

      {isError ? (
        <ErrorState description={(error as Error)?.message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListSkeleton rows={3} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="No CVs saved yet"
          description="Add your CV versions so you always know which one you sent."
          icon={<FileText className="h-5 w-5" aria-hidden />}
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add CV
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {data?.items.map((cv) => (
            <li key={cv.id}>
              <Card>
                <CardBody className="flex flex-wrap items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {cv.name}
                      {cv.isDefault ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cv.version ? `${cv.version} · ` : ""}
                      Added {formatDate(cv.createdAt)} · Used in {cv.usageCount ?? 0} application
                      {cv.usageCount === 1 ? "" : "s"}
                      {cv.fileSize ? ` · ${Math.round(cv.fileSize / 1024)} KB` : ""}
                    </p>
                    {cv.notes ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{cv.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {cv.hasFile ? (
                      <>
                        <a
                          href={withToken(`/api/cvs/${cv.id}`)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden /> Preview
                        </a>
                        <a
                          href={withToken(`/api/cvs/${cv.id}?download=1`)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden /> Download
                        </a>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400">No file attached</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${cv.name}`}
                      onClick={() => setPendingDelete(cv.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add a CV version"
        description="Attach a PDF (optional, max 4 MB) so you can preview it later."
        footer={
          <>
            <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="cv-form" loading={create.isPending}>
              Save CV
            </Button>
          </>
        }
      >
        <form id="cv-form" onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="cv-name" error={formError ?? undefined} required>
            <Input
              id="cv-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="CV — Frontend Developer — 2026"
            />
          </Field>
          <Field label="Version" htmlFor="cv-version">
            <Input
              id="cv-version"
              value={form.version}
              onChange={(event) => setForm({ ...form, version: event.target.value })}
              placeholder="2026.1"
            />
          </Field>
          <Field label="Notes" htmlFor="cv-notes">
            <Textarea
              id="cv-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="What makes this version different?"
            />
          </Field>
          <Field label="PDF file" htmlFor="cv-file" hint="Optional. Stored privately for your account.">
            <Input
              id="cv-file"
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Field>
          <Checkbox
            label="Make this my default CV"
            checked={form.isDefault}
            onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
          />
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this CV?"
        description="Applications that reference it will simply show “Not specified”."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await remove.mutateAsync(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
