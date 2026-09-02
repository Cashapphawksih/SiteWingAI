import type { FaqSection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";

import { editableAttributes, sectionAttributes } from "../editor-metadata";
import styles from "../site-renderer.module.css";

interface FaqSectionProps {
  section: FaqSection;
  editor?: RendererEditorState;
}

export function FaqSectionComponent({ section, editor }: FaqSectionProps) {
  const { content } = section;

  return (
    <section id={section.id} className={styles.faqSection} {...sectionAttributes(editor, section.id)}>
      <div className={styles.faqHeading}>
        {content.eyebrow ? (
          <p className={styles.eyebrow} {...editableAttributes(editor, { kind: "field", field: "faq.eyebrow", sectionId: section.id })}>{content.eyebrow}</p>
        ) : null}
        <h2 {...editableAttributes(editor, { kind: "field", field: "faq.heading", sectionId: section.id })}>{content.heading}</h2>
      </div>

      <div className={styles.faqList}>
        {content.items.map((item, index) => (
          <details key={item.id} open={index === 0}>
            <summary>
              <span {...editableAttributes(editor, { kind: "field", field: "faq.item.question", sectionId: section.id, itemId: item.id })}>{item.question}</span>
              <span aria-hidden="true">+</span>
            </summary>
            <p {...editableAttributes(editor, { kind: "field", field: "faq.item.answer", sectionId: section.id, itemId: item.id })}>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
