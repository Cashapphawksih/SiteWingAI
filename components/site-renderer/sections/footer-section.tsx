import type { BusinessDetails, FooterSection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";
import { resolveWebsiteHref } from "@/lib/website-links";

import { editableAttributes, layoutAttributes, sectionAttributes } from "../editor-metadata";
import styles from "../site-renderer.module.css";

interface FooterSectionProps {
  section: FooterSection;
  business: BusinessDetails;
  editor?: RendererEditorState;
  publicBasePath?: string;
}

export function FooterSectionComponent({
  section,
  business,
  editor,
  publicBasePath,
}: FooterSectionProps) {
  const { content } = section;

  return (
    <footer id={section.id} className={styles.footer} {...layoutAttributes(section)} {...sectionAttributes(editor, section.id)}>
      <div className={styles.footerTop}>
        <p className={styles.footerBrand}>{business.name}</p>
        {content.statement ? (
          <p className={styles.footerStatement} {...editableAttributes(editor, { kind: "field", field: "footer.statement", sectionId: section.id })}>{content.statement}</p>
        ) : null}
      </div>
      <div className={styles.footerBottom}>
        <p {...editableAttributes(editor, { kind: "field", field: "footer.copyright", sectionId: section.id })}>{content.copyright}</p>
        {content.links?.length ? (
          <nav aria-label="Footer navigation">
            {content.links.map((link) => (
              <a key={`${link.label}-${link.href}`} href={resolveWebsiteHref(link.href, publicBasePath)}>
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
