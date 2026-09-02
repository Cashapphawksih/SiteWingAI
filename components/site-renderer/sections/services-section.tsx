import type { ServicesSection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";

import { editableAttributes, layoutAttributes, sectionAttributes } from "../editor-metadata";
import styles from "../site-renderer.module.css";

interface ServicesSectionProps {
  section: ServicesSection;
  editor?: RendererEditorState;
}

export function ServicesSectionComponent({ section, editor }: ServicesSectionProps) {
  const { content } = section;

  return (
    <section id={section.id} className={styles.section} {...layoutAttributes(section)} {...sectionAttributes(editor, section.id)}>
      <div className={styles.sectionIntro}>
        <div>
          {content.eyebrow ? (
            <p className={styles.eyebrow} {...editableAttributes(editor, { kind: "field", field: "services.eyebrow", sectionId: section.id })}>{content.eyebrow}</p>
          ) : null}
          <h2 {...editableAttributes(editor, { kind: "field", field: "services.heading", sectionId: section.id })}>{content.heading}</h2>
        </div>
        {content.introduction ? <p {...editableAttributes(editor, { kind: "field", field: "services.introduction", sectionId: section.id })}>{content.introduction}</p> : null}
      </div>

      <div className={styles.servicesGrid}>
        {content.services.map((service) => (
          <article key={service.id} className={styles.serviceCard}>
            <p className={styles.serviceNumber}>{service.number}</p>
            <h3 {...editableAttributes(editor, { kind: "field", field: "services.service.name", sectionId: section.id, itemId: service.id })}>{service.name}</h3>
            <p {...editableAttributes(editor, { kind: "field", field: "services.service.description", sectionId: section.id, itemId: service.id })}>{service.description}</p>
            {service.detail ? (
              <p className={styles.serviceDetail}>{service.detail}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
