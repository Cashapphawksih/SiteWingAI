"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type { WebsitePage } from "@/types/website";

import styles from "./preview-workspace.module.css";

interface PageToolbarProps {
  currentPageId: string;
  error: string | null;
  onAdd: (name: string) => void;
  onMove: (pageId: string, direction: -1 | 1) => void;
  onRemove: (pageId: string) => void;
  onSelect: (pageId: string) => void;
  onToggle: (pageId: string, enabled: boolean) => void;
  onUpdate: (pageId: string, title: string, navLabel: string) => void;
  pages: WebsitePage[];
}

export function PageToolbar(props: PageToolbarProps) {
  const currentPage = props.pages.find((page) => page.id === props.currentPageId) ?? props.pages[0];
  return (
    <div className={styles.pageToolbar}>
      <div className={styles.pageTabs} aria-label="Website pages">
        {props.pages.map((page) => (
          <button
            key={page.id}
            type="button"
            aria-pressed={page.id === currentPage.id}
            onClick={() => props.onSelect(page.id)}
            title={page.enabled ? page.slug : `${page.slug} · Hidden`}
          >
            {page.navLabel}<span aria-hidden="true">{page.enabled ? "" : " ·"}</span>
          </button>
        ))}
      </div>
      <details className={styles.pageManager}>
        <summary>Pages</summary>
        <div className={styles.pageManagerPanel}>
          <PageEditor key={currentPage.id} page={currentPage} pageIndex={props.pages.indexOf(currentPage)} pageCount={props.pages.length} {...props} />
          <AddPageForm onAdd={props.onAdd} />
          {props.error ? <p className={styles.pageError} role="alert">{props.error}</p> : null}
        </div>
      </details>
    </div>
  );
}

function PageEditor({ onMove, onRemove, onToggle, onUpdate, page, pageCount, pageIndex }: PageToolbarProps & { page: WebsitePage; pageCount: number; pageIndex: number }) {
  const [title, setTitle] = useState(page.title);
  const [navLabel, setNavLabel] = useState(page.navLabel);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onUpdate(page.id, title, navLabel);
  }
  return (
    <form className={styles.pageEditor} onSubmit={submit}>
      <div className={styles.pageManagerHeading}><div><p>Current page</p><strong>{page.slug}</strong></div><span>{page.enabled ? "Visible" : "Hidden"}</span></div>
      <label htmlFor="page-title">Page title</label>
      <input id="page-title" value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} required />
      <label htmlFor="page-nav-label">Navigation label</label>
      <input id="page-nav-label" value={navLabel} maxLength={160} onChange={(event) => setNavLabel(event.target.value)} required />
      <button type="submit" className={styles.pagePrimaryAction}>Apply page details</button>
      <div className={styles.pageActionGrid}>
        <button type="button" disabled={pageIndex === 0} onClick={() => onMove(page.id, -1)}>Move left</button>
        <button type="button" disabled={pageIndex === pageCount - 1} onClick={() => onMove(page.id, 1)}>Move right</button>
        <button type="button" disabled={page.slug === "/" && page.enabled} onClick={() => onToggle(page.id, !page.enabled)}>{page.enabled ? "Hide page" : "Show page"}</button>
        <button type="button" disabled={page.slug === "/"} onClick={() => onRemove(page.id)}>Remove page</button>
      </div>
    </form>
  );
}

function AddPageForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd(name);
    setName("");
  }
  return (
    <form className={styles.addPageForm} onSubmit={submit}>
      <label htmlFor="new-page-name">Add supported page</label>
      <div><input id="new-page-name" value={name} maxLength={160} onChange={(event) => setName(event.target.value)} placeholder="Process" required /><button type="submit">Add</button></div>
    </form>
  );
}
