import type { TestimonialsSection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";

import { editableAttributes, layoutAttributes, sectionAttributes } from "../editor-metadata";
import styles from "../site-renderer.module.css";

interface TestimonialsSectionProps {
  section: TestimonialsSection;
  editor?: RendererEditorState;
}

export function TestimonialsSectionComponent({
  section,
  editor,
}: TestimonialsSectionProps) {
  const { content } = section;

  return (
    <section id={section.id} className={styles.section} {...layoutAttributes(section)} {...sectionAttributes(editor, section.id)}>
      <div className={styles.testimonialHeading}>
        {content.eyebrow ? (
          <p className={styles.eyebrow} {...editableAttributes(editor, { kind: "field", field: "testimonials.eyebrow", sectionId: section.id })}>{content.eyebrow}</p>
        ) : null}
        <h2 {...editableAttributes(editor, { kind: "field", field: "testimonials.heading", sectionId: section.id })}>{content.heading}</h2>
      </div>

      <div className={styles.testimonialsGrid}>
        {content.testimonials.map((testimonial) => (
          <figure key={testimonial.id} className={styles.testimonialCard}>
            <blockquote {...editableAttributes(editor, { kind: "field", field: "testimonials.testimonial.quote", sectionId: section.id, itemId: testimonial.id })}>“{testimonial.quote}”</blockquote>
            <figcaption>
              <strong {...editableAttributes(editor, { kind: "field", field: "testimonials.testimonial.name", sectionId: section.id, itemId: testimonial.id })}>{testimonial.name}</strong>
              {testimonial.context ? <span>{testimonial.context}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
