import type { HeroSection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";
import { resolveWebsiteHref } from "@/lib/website-links";

import { editableAttributes, layoutAttributes, sectionAttributes } from "../editor-metadata";
import { MediaRenderer } from "../media-renderer";
import styles from "../site-renderer.module.css";

interface HeroSectionProps {
  section: HeroSection;
  editor?: RendererEditorState;
  publicBasePath?: string;
  publicPageSlug?: string;
}

export function HeroSectionComponent({ section, editor, publicBasePath, publicPageSlug }: HeroSectionProps) {
  const { content } = section;

  return (
    <section id={section.id} className={styles.heroSection} {...layoutAttributes(section)} {...sectionAttributes(editor, section.id)}>
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          {content.eyebrow ? (
            <p className={styles.eyebrow} {...editableAttributes(editor, { kind: "field", field: "hero.eyebrow", sectionId: section.id })}>{content.eyebrow}</p>
          ) : null}
          <h1 {...editableAttributes(editor, { kind: "field", field: "hero.heading", sectionId: section.id })}>{content.heading}</h1>
          <p className={styles.heroDescription} {...editableAttributes(editor, { kind: "field", field: "hero.description", sectionId: section.id })}>{content.description}</p>
          <div className={styles.actionRow}>
            <a
              className={styles.primaryButton}
              href={resolveWebsiteHref(content.primaryAction.href, publicBasePath, publicPageSlug)}
              aria-label={content.primaryAction.accessibleLabel}
              {...editableAttributes(editor, { kind: "field", field: "hero.primaryAction.label", sectionId: section.id })}
            >
              {content.primaryAction.label}
            </a>
            {content.secondaryAction ? (
              <a
                className={styles.secondaryButton}
                href={resolveWebsiteHref(content.secondaryAction.href, publicBasePath, publicPageSlug)}
                aria-label={content.secondaryAction.accessibleLabel}
                {...editableAttributes(editor, { kind: "field", field: "hero.secondaryAction.label", sectionId: section.id })}
              >
                {content.secondaryAction.label}
              </a>
            ) : null}
          </div>
        </div>

        {content.media ? (
          <div className={styles.heroMedia}>
            <MediaRenderer
              media={content.media}
              priority
              editor={editor}
              selection={{ kind: "media", field: "hero.media", sectionId: section.id }}
            />
          </div>
        ) : null}
      </div>

      {content.proofPoints?.length ? (
        <ul className={styles.proofPoints} aria-label="Service highlights">
          {content.proofPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
