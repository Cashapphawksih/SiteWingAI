"use client";

import type { DragEvent, FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

import {
  getCompanionHrefSelection,
  getEditableFieldDescriptor,
  getSelectedMedia,
  getSelectedFieldValue,
  isRequiredSection,
  type MediaDetailsUpdate,
} from "@/lib/website-config-editor";
import {
  SECTION_VARIANTS,
  VARIANT_LABELS,
  getSectionVariant,
  isVariantSectionType,
  type WebsiteSectionVariant,
} from "@/lib/website-design-system";
import type { WebsiteConfig } from "@/types/website";
import type { FieldSelection, MediaSelection, WebsiteSelection } from "@/types/website-editor";

import styles from "./preview-workspace.module.css";

interface SelectionInspectorProps {
  activation: number;
  config: WebsiteConfig;
  error: string | null;
  onClose: () => void;
  onFieldSave: (selection: FieldSelection, value: string, companionValue?: string) => void;
  onMoveSection: (pageId: string, sectionId: string, direction: -1 | 1) => void;
  onMediaRemove: (selection: MediaSelection) => void;
  onMediaSave: (selection: MediaSelection, details: MediaDetailsUpdate) => void;
  onMediaUpload: (selection: MediaSelection, file: File) => Promise<void>;
  onMoveGalleryItem: (selection: MediaSelection, direction: -1 | 1) => void;
  onSetSectionEnabled: (pageId: string, sectionId: string, enabled: boolean) => void;
  onSetSectionVariant: (pageId: string | undefined, sectionId: string, variant: WebsiteSectionVariant) => void;
  selection: WebsiteSelection;
}

export function SelectionInspector(props: SelectionInspectorProps) {
  const { selection } = props;
  return selection.kind === "media" ? (
    <MediaInspector key={`${selection.pageId}-${selection.sectionId}-${selection.itemId}-${JSON.stringify(getSelectedMedia(props.config, selection))}`} {...props} selection={selection} />
  ) : selection.kind === "field" ? (
    <FieldInspector key={`${selection.field}-${selection.sectionId}-${selection.itemId}-${selection.itemIndex}`} {...props} selection={selection} />
  ) : (
    <SectionInspector {...props} selection={selection} />
  );
}

function MediaInspector({ config, error, onClose, onMediaRemove, onMediaSave, onMediaUpload, onMoveGalleryItem, selection }: SelectionInspectorProps & { selection: MediaSelection }) {
  const media = getSelectedMedia(config, selection);
  const page = config.pages.find((candidate) => candidate.id === selection.pageId);
  const gallery = selection.field === "gallery.item.media"
    ? page?.sections.find((section) => section.id === selection.sectionId && section.type === "gallery")
    : undefined;
  const galleryItem = gallery?.type === "gallery" ? gallery.content.items.find((item) => item.id === selection.itemId) : undefined;
  const galleryIndex = gallery?.type === "gallery" ? gallery.content.items.findIndex((item) => item.id === selection.itemId) : -1;
  const [alt, setAlt] = useState(media?.kind === "image" ? media.alt : "");
  const [fit, setFit] = useState(media?.kind === "image" ? media.fit ?? "cover" : "cover");
  const [title, setTitle] = useState(galleryItem?.title ?? "");
  const [category, setCategory] = useState(galleryItem?.category ?? "");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      await onMediaUpload(selection, file);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    void upload(event.dataTransfer.files[0]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onMediaSave(selection, { alt, fit, title: galleryItem ? title : undefined, category: galleryItem ? category : undefined });
  }

  if (!media) return null;
  return (
    <aside className={styles.inspector} aria-label="Media properties">
      <InspectorHeader eyebrow="Media" title={selection.field === "hero.media" ? "Hero image" : "Gallery image"} onClose={onClose} />
      <div className={styles.mediaInspectorBody}>
        <div className={styles.mediaInspectorPreview}>
          {media.kind === "image" ? (
            // Temporary object URLs and future hosted URLs are rendered without Next image-host coupling.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.src} alt="" data-fit={media.fit ?? "cover"} />
          ) : <div><span>Image needed</span><p>{media.label}</p></div>}
        </div>
        <label
          className={styles.mediaUploadControl}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <span>{uploading ? "Uploading…" : media.kind === "image" ? "Replace image" : "Upload image"}</span>
          <small>JPEG, PNG, or WebP · up to 10 MB</small>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = ""; }}
          />
        </label>
        {media.kind === "image" ? (
          <form className={styles.mediaDetailsForm} onSubmit={submit}>
            <label htmlFor="media-alt">Alt text</label>
            <textarea id="media-alt" value={alt} maxLength={500} rows={3} required onChange={(event) => setAlt(event.target.value)} />
            <label htmlFor="media-fit">Image fit</label>
            <select id="media-fit" value={fit} onChange={(event) => setFit(event.target.value as "cover" | "contain")}>
              <option value="cover">Fill frame</option>
              <option value="contain">Show full image</option>
            </select>
            {galleryItem ? (
              <>
                <label htmlFor="media-caption">Caption</label>
                <input id="media-caption" value={title} maxLength={160} required onChange={(event) => setTitle(event.target.value)} />
                <label htmlFor="media-category">Category</label>
                <input id="media-category" value={category} maxLength={160} onChange={(event) => setCategory(event.target.value)} />
              </>
            ) : null}
            <button type="submit" className={styles.mediaSaveButton}>Save media details</button>
          </form>
        ) : null}
        {gallery?.type === "gallery" ? (
          <div className={styles.mediaOrderControls}>
            <p>Gallery order</p>
            <div>
              <button type="button" disabled={galleryIndex <= 0} onClick={() => onMoveGalleryItem(selection, -1)}>Move earlier</button>
              <button type="button" disabled={galleryIndex === gallery.content.items.length - 1} onClick={() => onMoveGalleryItem(selection, 1)}>Move later</button>
            </div>
          </div>
        ) : null}
        {media.kind === "image" && media.source === "temporary" ? <p className={styles.mediaTemporaryNote}>This browser-local image will not survive a reload.</p> : null}
        {media.kind === "image" && media.source === "storage" ? <p className={styles.mediaTemporaryNote}>Uploaded and saved with this project.</p> : null}
        {error ? <p className={styles.inspectorError} role="alert">{error}</p> : null}
        <button type="button" className={styles.mediaRemoveButton} onClick={() => onMediaRemove(selection)}>
          {selection.field === "hero.media" ? "Remove image" : "Remove gallery item"}
        </button>
      </div>
    </aside>
  );
}

function FieldInspector({ activation, config, error, onClose, onFieldSave, selection }: SelectionInspectorProps & { selection: FieldSelection }) {
  const descriptor = getEditableFieldDescriptor(selection.field);
  const companion = getCompanionHrefSelection(selection);
  const [value, setValue] = useState(() => getSelectedFieldValue(config, selection) ?? "");
  const [companionValue, setCompanionValue] = useState(() => companion ? getSelectedFieldValue(config, companion) ?? "" : "");
  const editorRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activation > 0) editorRef.current?.focus();
  }, [activation]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onFieldSave(selection, value, companion ? companionValue : undefined);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Enter" && (!descriptor.multiline || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <aside className={styles.inspector} aria-label="Element properties">
      <InspectorHeader eyebrow="Element" title={descriptor.label} onClose={onClose} />
      <form onSubmit={submit}>
        <label htmlFor="selection-value">Text</label>
        {descriptor.multiline ? (
          <textarea
            id="selection-value"
            maxLength={descriptor.maxLength}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            ref={editorRef as React.RefObject<HTMLTextAreaElement>}
            required
            rows={4}
            value={value}
          />
        ) : (
          <input
            id="selection-value"
            inputMode={descriptor.inputMode}
            maxLength={descriptor.maxLength}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            ref={editorRef as React.RefObject<HTMLInputElement>}
            required
            value={value}
          />
        )}
        {companion ? (
          <>
            <label htmlFor="selection-destination">Destination</label>
            <input
              id="selection-destination"
              inputMode="url"
              maxLength={500}
              onChange={(event) => setCompanionValue(event.target.value)}
              onKeyDown={handleKeyDown}
              required
              value={companionValue}
            />
            <p className={styles.inspectorHint}>Use #section, /page, https://, mailto:, or tel:.</p>
          </>
        ) : null}
        {descriptor.multiline ? <p className={styles.inspectorHint}>Press ⌘ Enter to save. Escape cancels.</p> : <p className={styles.inspectorHint}>Press Enter to save. Escape cancels.</p>}
        {error ? <p className={styles.inspectorError} role="alert">{error}</p> : null}
        <div className={styles.inspectorActions}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </aside>
  );
}

function SectionInspector({ config, error, onClose, onMoveSection, onSetSectionEnabled, onSetSectionVariant, selection }: SelectionInspectorProps & { selection: Extract<WebsiteSelection, { kind: "section" }> }) {
  const page = config.pages.find((item) => item.id === selection.pageId);
  const section = selection.sectionId === config.footer.id
    ? config.footer
    : page?.sections.find((item) => item.id === selection.sectionId);
  if (!section) return null;
  const index = page?.sections.findIndex((item) => item.id === section.id) ?? -1;
  const required = isRequiredSection(section);
  const canMove = section.type !== "footer" && Boolean(page);
  return (
    <aside className={styles.inspector} aria-label="Section properties">
      <InspectorHeader eyebrow="Section" title={section.type} onClose={onClose} />
      <div className={styles.sectionInspectorBody}>
        {isVariantSectionType(section.type) ? (
          <div className={styles.sectionControlGroup}>
            <label htmlFor="section-layout">Layout</label>
            <select
              id="section-layout"
              value={getSectionVariant(section)}
              onChange={(event) => onSetSectionVariant(selection.pageId, section.id, event.target.value as WebsiteSectionVariant)}
            >
              {SECTION_VARIANTS[section.type].map((variant) => (
                <option key={variant} value={variant}>{VARIANT_LABELS[variant]}</option>
              ))}
            </select>
            <span>Changes composition without changing content or media.</span>
          </div>
        ) : null}
        <div className={styles.sectionControlGroup}>
          <p>Order</p>
          <div className={styles.sectionButtons}>
            <button type="button" disabled={!canMove || index === 0} onClick={() => selection.pageId && onMoveSection(selection.pageId, section.id, -1)}>Move up</button>
            <button type="button" disabled={!canMove || index === (page?.sections.length ?? 0) - 1} onClick={() => selection.pageId && onMoveSection(selection.pageId, section.id, 1)}>Move down</button>
          </div>
        </div>
        <div className={styles.sectionControlGroup}>
          <p>Visibility</p>
          <button type="button" className={styles.visibilityButton} disabled={required && section.enabled} onClick={() => selection.pageId && onSetSectionEnabled(selection.pageId, section.id, !section.enabled)}>
            {section.enabled ? "Hide section" : "Show section"}
          </button>
          {required ? <span>Required sections stay visible.</span> : null}
        </div>
        {error ? <p className={styles.inspectorError} role="alert">{error}</p> : null}
      </div>
    </aside>
  );
}

function InspectorHeader({ eyebrow, onClose, title }: { eyebrow: string; onClose: () => void; title: string }) {
  return (
    <header className={styles.inspectorHeader}>
      <div><p>{eyebrow}</p><h2>{title}</h2></div>
      <button type="button" onClick={onClose} aria-label="Close properties">×</button>
    </header>
  );
}
