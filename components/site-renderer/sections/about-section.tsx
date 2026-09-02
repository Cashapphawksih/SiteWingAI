import type { AboutSection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";

import { editableAttributes, layoutAttributes, sectionAttributes } from "../editor-metadata";
import styles from "../site-renderer.module.css";

interface AboutSectionProps {
  section: AboutSection;
  editor?: RendererEditorState;
}

export function AboutSectionComponent({ section, editor }: AboutSectionProps) {
  const { content } = section;

  return (
    <section id={section.id} className={styles.aboutSection} {...layoutAttributes(section)} {...sectionAttributes(editor, section.id)}>
      <div className={styles.aboutHeading}>
        {content.eyebrow ? (
          <p className={styles.eyebrow} {...editableAttributes(editor, { kind: "field", field: "about.eyebrow", sectionId: section.id })}>{content.eyebrow}</p>
        ) : null}
        <h2 {...editableAttributes(editor, { kind: "field", field: "about.heading", sectionId: section.id })}>{content.heading}</h2>
      </div>

      <div className={styles.aboutBody}>
        {content.body.map((paragraph, index) => (
          <p key={`${section.id}-body-${index}`} {...editableAttributes(editor, { kind: "field", field: "about.body", sectionId: section.id, itemIndex: index })}>{paragraph}</p>
        ))}
      </div>

      {content.highlights?.length ? (
        <dl className={styles.highlights}>
          {content.highlights.map((highlight) => (
            <div key={highlight.label}>
              <dt>{highlight.label}</dt>
              <dd>{highlight.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
