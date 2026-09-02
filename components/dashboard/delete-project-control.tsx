"use client";

import { useState } from "react";

import { deleteProjectAction } from "@/app/dashboard/actions";

export function DeleteProjectControl({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return <button type="button" className="text-xs font-semibold text-muted hover:text-red-800" onClick={() => setConfirming(true)}>Delete</button>;
  }

  return (
    <form action={deleteProjectAction} className="flex flex-wrap items-center gap-2" aria-label={`Confirm deletion of ${projectName}`}>
      <input type="hidden" name="projectId" value={projectId} />
      <span className="text-xs text-red-900">Delete permanently?</span>
      <button type="submit" className="border border-red-800 px-2 py-1 text-xs font-semibold text-red-900 hover:bg-red-50">Confirm</button>
      <button type="button" className="px-2 py-1 text-xs text-muted hover:text-foreground" onClick={() => setConfirming(false)}>Cancel</button>
    </form>
  );
}
