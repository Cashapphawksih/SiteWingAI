"use client";

import { useRef } from "react";
import Link from "next/link";

import { getPhoneHref } from "@/lib/website-config";
import { resolveWebsiteHref } from "@/lib/website-links";
import type { BusinessDetails, NavigationItem, WebsiteSlug } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";

import { editableAttributes } from "./editor-metadata";
import styles from "./site-renderer.module.css";

interface SiteNavigationProps {
  business: BusinessDetails;
  navigation: NavigationItem[];
  currentPageSlug: WebsiteSlug;
  editor?: RendererEditorState;
  onNavigate?: (href: string) => void;
  publicBasePath?: string;
}

export function SiteNavigation({
  business,
  navigation,
  currentPageSlug,
  editor,
  onNavigate,
  publicBasePath,
}: SiteNavigationProps) {
  const phoneHref = getPhoneHref(business.phone);
  const mobileMenu = useRef<HTMLDetailsElement>(null);

  function handlePageNavigation(event: React.MouseEvent<HTMLAnchorElement>, item: NavigationItem) {
    if (!item.href.startsWith("/") || !onNavigate) return;
    event.preventDefault();
    onNavigate(item.href);
    mobileMenu.current?.removeAttribute("open");
  }

  function handleHomeNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!onNavigate) return;
    event.preventDefault();
    onNavigate("/");
    mobileMenu.current?.removeAttribute("open");
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (mobileMenu.current?.hasAttribute("open")) {
      mobileMenu.current.removeAttribute("open");
    } else {
      mobileMenu.current?.setAttribute("open", "");
    }
  }

  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <Link className={styles.wordmark} href={resolveWebsiteHref("/", publicBasePath)} aria-label={`${business.name} home`} onClick={handleHomeNavigation}>
          <span className={styles.wordmarkIcon} aria-hidden="true">
            A
          </span>
          <span>{business.name}</span>
        </Link>

        <nav className={styles.desktopNavigation} aria-label="Website navigation">
          {navigation.map((item) => (
            <a key={item.id} href={resolveWebsiteHref(item.href, publicBasePath)} aria-current={item.href === currentPageSlug ? "page" : undefined} onClick={(event) => handlePageNavigation(event, item)} {...editableAttributes(editor, { kind: "field", field: "navigation.label", itemId: item.id })}>
              {item.label}
            </a>
          ))}
        </nav>

        <a
          className={styles.headerAction}
          href={phoneHref}
          aria-label={`Call ${business.name} at ${business.phone}`}
        >
          Get a quote
        </a>

        <details className={styles.mobileNavigation} ref={mobileMenu}>
          <summary onKeyDown={handleMenuKeyDown}>Menu</summary>
          <nav aria-label="Mobile website navigation">
            {navigation.map((item) => (
              <a key={item.id} href={resolveWebsiteHref(item.href, publicBasePath)} aria-current={item.href === currentPageSlug ? "page" : undefined} onClick={(event) => handlePageNavigation(event, item)} {...editableAttributes(editor, { kind: "field", field: "navigation.label", itemId: item.id })}>
                {item.label}
              </a>
            ))}
            <a href={phoneHref}>Call {business.phone}</a>
          </nav>
        </details>
      </div>
    </header>
  );
}
