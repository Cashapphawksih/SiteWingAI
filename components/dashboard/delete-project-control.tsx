"use client";

import { useState } from "react";

import { deleteProjectAction } from "@/app/dashboard/actions";

export function DeleteProjectControl({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return <button type="button" className="min-h-8 px-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted hover:text-danger" onClick={() => setConfirming(true)}>Delete</button>;
  }

  return (
    <form action={deleteProjectAction} className="flex max-w-48 flex-wrap items-center justify-end gap-2" aria-label={`Confirm deletion of ${projectName}`}>
      <input type="hidden" name="projectId" value={projectId} />
      <span className="basis-full text-right text-[10px] font-semibold text-danger">Delete permanently?</span>
      <button type="submit" className="min-h-8 border border-danger px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-danger hover:bg-danger hover:text-white">Confirm</button>
      <button type="button" className="min-h-8 px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted hover:text-foreground" onClick={() => setConfirming(false)}>Cancel</button>
    </form>
  );
}
