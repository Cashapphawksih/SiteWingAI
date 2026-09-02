import "server-only";

import { SITE_MEDIA_BUCKET } from "@/lib/media/storage-media";
import { createClient } from "@/lib/supabase/server";

const LIST_BATCH_SIZE = 1000;
const MAX_DELETE_BATCHES = 100;

export async function deleteAllProjectMedia(userId: string, projectId: string): Promise<boolean> {
  const supabase = await createClient();
  const prefix = `${userId}/${projectId}`;

  for (let batch = 0; batch < MAX_DELETE_BATCHES; batch += 1) {
    const { data, error } = await supabase.storage.from(SITE_MEDIA_BUCKET).list(prefix, {
      limit: LIST_BATCH_SIZE,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      console.error("[project-media:cleanup] storage listing failed", { code: error.name, projectId });
      return false;
    }
    const paths = (data ?? []).filter((entry) => entry.id).map((entry) => `${prefix}/${entry.name}`);
    if (paths.length === 0) return true;
    const { error: removeError } = await supabase.storage.from(SITE_MEDIA_BUCKET).remove(paths);
    if (removeError) {
      console.error("[project-media:cleanup] storage removal failed", { code: removeError.name, projectId });
      return false;
    }
    if (paths.length < LIST_BATCH_SIZE) return true;
  }

  console.error("[project-media:cleanup] cleanup safety limit reached", { projectId });
  return false;
}
