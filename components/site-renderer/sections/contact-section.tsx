import { getEmailHref, getPhoneHref } from "@/lib/website-config";
import type { BusinessDetails, ContactSection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";

import { editableAttributes, layoutAttributes, sectionAttributes } from "../editor-metadata";
import styles from "../site-renderer.module.css";

interface ContactSectionProps {
  section: ContactSection;
  business: BusinessDetails;
  editor?: RendererEditorState;
}

export function ContactSectionComponent({
  section,
  business,
  editor,
}: ContactSectionProps) {
  const { content } = section;

  return (
    <section id={section.id} className={styles.contactSection} {...layoutAttributes(section)} {...sectionAttributes(editor, section.id)}>
      <div className={styles.contactHeading}>
        {content.eyebrow ? (
          <p className={styles.eyebrow} {...editableAttributes(editor, { kind: "field", field: "contact.eyebrow", sectionId: section.id })}>{content.eyebrow}</p>
        ) : null}
        <h2 {...editableAttributes(editor, { kind: "field", field: "contact.heading", sectionId: section.id })}>{content.heading}</h2>
        {content.description ? <p {...editableAttributes(editor, { kind: "field", field: "contact.description", sectionId: section.id })}>{content.description}</p> : null}
      </div>

      <dl className={styles.contactDetails}>
        <div>
          <dt>{content.phoneLabel ?? "Phone"}</dt>
          <dd>
            <a href={getPhoneHref(business.phone)} {...editableAttributes(editor, { kind: "field", field: "business.phone", sectionId: section.id })}>{business.phone}</a>
          </dd>
        </div>
        <div>
          <dt>{content.emailLabel ?? "Email"}</dt>
          <dd>
            <a href={getEmailHref(business.email)} {...editableAttributes(editor, { kind: "field", field: "business.email", sectionId: section.id })}>{business.email}</a>
          </dd>
        </div>
        <div>
          <dt>{content.addressLabel ?? "Location"}</dt>
          <dd {...editableAttributes(editor, { kind: "field", field: "business.location", sectionId: section.id })}>{business.location}</dd>
        </div>
      </dl>

      {content.hours?.length ? (
        <div className={styles.hours}>
          <p>Hours</p>
          <dl>
            {content.hours.map((item) => (
              <div key={item.days}>
                <dt>{item.days}</dt>
                <dd>{item.times}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
