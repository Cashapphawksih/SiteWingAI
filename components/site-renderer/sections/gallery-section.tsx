import type { GallerySection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";

import { layoutAttributes, sectionAttributes } from "../editor-metadata";
import { MediaRenderer } from "../media-renderer";
import styles from "../site-renderer.module.css";

interface GallerySectionProps {
  section: GallerySection;
  editor?: RendererEditorState;
}

export function GallerySectionComponent({ section, editor }: GallerySectionProps) {
  const { content } = section;

  return (
    <section id={section.id} className={styles.gallerySection} {...layoutAttributes(section)} {...sectionAttributes(editor, section.id)}>
      <div className={styles.galleryHeading}>
        {content.eyebrow ? (
          <p className={styles.eyebrow}>{content.eyebrow}</p>
        ) : null}
        <h2>{content.heading}</h2>
      </div>

      <div className={styles.galleryGrid}>
        {content.items.map((item) => (
          <figure key={item.id} className={styles.galleryItem}>
            <div className={styles.galleryMedia}>
              <MediaRenderer
                media={item.media}
                editor={editor}
                selection={{ kind: "media", field: "gallery.item.media", sectionId: section.id, itemId: item.id }}
              />
            </div>
            <figcaption>
              <span>{item.title}</span>
              {item.category ? <span>{item.category}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
