import { getEnabledSections, getHomePage, getPageById, getWebsiteThemeProperties } from "@/lib/website-config";
import { getThemeTokens } from "@/lib/website-design-system";
import type { WebsiteConfig } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";

import { SectionRenderer } from "./section-renderer";
import { SiteNavigation } from "./site-navigation";
import styles from "./site-renderer.module.css";

export interface SiteRendererProps {
  config: WebsiteConfig;
  currentPageId?: string;
  editor?: RendererEditorState;
  onNavigate?: (href: string) => void;
  publicBasePath?: string;
}

export function SiteRenderer({ config, currentPageId, editor, onNavigate, publicBasePath }: SiteRendererProps) {
  const requestedPage = getPageById(config, currentPageId);
  const currentPage = requestedPage?.enabled ? requestedPage : getHomePage(config);
  const mainSections = getEnabledSections(currentPage);
  const themeTokens = getThemeTokens(config.theme);

  return (
    <div
      className={styles.site}
      data-theme-style={config.theme.style}
      data-font-style={config.theme.fontStyle}
      data-font-pairing={themeTokens.fontPairing}
      data-heading-scale={themeTokens.headingScale}
      data-spacing-density={themeTokens.spacingDensity}
      data-border-style={themeTokens.borderStyle}
      data-surface-contrast={themeTokens.surfaceContrast}
      data-button-style={themeTokens.buttonStyle}
      data-navigation-style={themeTokens.navigationStyle}
      data-sitewing-editing={editor?.enabled ? "true" : undefined}
      style={getWebsiteThemeProperties(config)}
    >
      <SiteNavigation
        business={config.business}
        navigation={config.navigation}
        currentPageSlug={currentPage.slug}
        editor={editor}
        onNavigate={onNavigate}
        publicBasePath={publicBasePath}
      />
      <main>
        {mainSections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            business={config.business}
            editor={editor}
            publicBasePath={publicBasePath}
            publicPageSlug={currentPage.slug}
          />
        ))}
      </main>
      {config.footer.enabled ? (
        <SectionRenderer
          section={config.footer}
          business={config.business}
          editor={editor}
          publicBasePath={publicBasePath}
          publicPageSlug="/"
        />
      ) : null}
    </div>
  );
}
