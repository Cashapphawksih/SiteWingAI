import type { WebsiteMedia } from "@/types/website";
import type { MediaSelection, RendererEditorState } from "@/types/website-editor";

import { editableAttributes } from "./editor-metadata";
import styles from "./site-renderer.module.css";

interface MediaRendererProps {
  media: WebsiteMedia;
  priority?: boolean;
  editor?: RendererEditorState;
  selection: MediaSelection;
}

export function MediaRenderer({ editor, media, priority = false, selection }: MediaRendererProps) {
  if (media.kind === "placeholder") {
    return (
      <div className={styles.mediaPlaceholder} aria-label={media.label} role="img" {...editableAttributes(editor, selection)}>
        <span aria-hidden="true">AT</span>
        <p>{media.label}</p>
      </div>
    );
  }

  return (
    // Config-driven sites may use approved remote image hosts added after this milestone.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.mediaImage}
      src={media.src}
      alt={media.alt}
      data-fit={media.fit ?? "cover"}
      width={media.width}
      height={media.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      {...editableAttributes(editor, selection)}
    />
  );
}
