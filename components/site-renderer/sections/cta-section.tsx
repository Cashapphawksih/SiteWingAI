import type { CtaSection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";
import { resolveWebsiteHref } from "@/lib/website-links";

import { editableAttributes, layoutAttributes, sectionAttributes } from "../editor-metadata";
import styles from "../site-renderer.module.css";

interface CtaSectionProps {
  section: CtaSection;
  editor?: RendererEditorState;
  publicBasePath?: string;
  publicPageSlug?: string;
}

export function CtaSectionComponent({ section, editor, publicBasePath, publicPageSlug }: CtaSectionProps) {
  const { content } = section;

  return (
    <section id={section.id} className={styles.ctaSection} {...layoutAttributes(section)} {...sectionAttributes(editor, section.id)}>
      <div>
        {content.eyebrow ? (
          <p className={styles.ctaEyebrow} {...editableAttributes(editor, { kind: "field", field: "cta.eyebrow", sectionId: section.id })}>{content.eyebrow}</p>
        ) : null}
        <h2 {...editableAttributes(editor, { kind: "field", field: "cta.heading", sectionId: section.id })}>{content.heading}</h2>
        {content.description ? <p {...editableAttributes(editor, { kind: "field", field: "cta.description", sectionId: section.id })}>{content.description}</p> : null}
      </div>
      <div className={styles.actionRow}>
        <a
          className={styles.ctaPrimaryButton}
          href={resolveWebsiteHref(content.primaryAction.href, publicBasePath, publicPageSlug)}
          aria-label={content.primaryAction.accessibleLabel}
          {...editableAttributes(editor, { kind: "field", field: "cta.primaryAction.label", sectionId: section.id })}
        >
          {content.primaryAction.label}
        </a>
        {content.secondaryAction ? (
          <a
            className={styles.ctaSecondaryButton}
            href={resolveWebsiteHref(content.secondaryAction.href, publicBasePath, publicPageSlug)}
            aria-label={content.secondaryAction.accessibleLabel}
            {...editableAttributes(editor, { kind: "field", field: "cta.secondaryAction.label", sectionId: section.id })}
          >
            {content.secondaryAction.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}
