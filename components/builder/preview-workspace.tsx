"use client";

import Link from "next/link";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { SiteRenderer } from "@/components/site-renderer/site-renderer";
import {
  getCompanionHrefSelection,
  getSelectedMedia,
  getSelectionKey,
  addBasicPage,
  moveSection,
  movePage,
  moveSelectedGalleryItem,
  parseSelectionKey,
  removePage,
  removeSelectedMedia,
  replaceSelectedMedia,
  selectionExists,
  setPageEnabled,
  setSectionEnabled,
  updatePageMetadata,
  updateSelectedMediaDetails,
  updateSelectedField,
  updateSectionVariant,
} from "@/lib/website-config-editor";
import type { WebsiteSectionVariant } from "@/lib/website-design-system";
import { collectTemporaryMediaUrls, createProjectMediaUploadAdapter } from "@/lib/media/media-upload";
import { collectStorageMediaPaths, isPersistentStorageMedia } from "@/lib/media/storage-media";
import { prepareWebsiteConfigForPersistence } from "@/lib/projects/persistence";
import { hashWebsiteConfig } from "@/lib/publishing/config";
import { getHomePage, getPageByHref, validateWebsiteConfig } from "@/lib/website-config";
import type { PersistedProjectMessage, ProjectSaveStatus } from "@/types/project";
import type { WebsiteConfig } from "@/types/website";
import type { PublicationResponse, PublicationState } from "@/types/publication";
import type { FieldSelection, MediaSelection, WebsiteSelection } from "@/types/website-editor";
import type { DnsInstruction, ProjectDomain } from "@/types/domain";

import { SelectionInspector } from "./selection-inspector";
import { PageToolbar } from "./page-toolbar";
import styles from "./preview-workspace.module.css";
import { DomainManager } from "./domain-manager";

type PreviewMode = "desktop" | "tablet" | "mobile";
type WorkspaceMode = "preview" | "edit" | "code";
type MobileSurface = "chat" | "canvas";
type OperationStatus = "idle" | "loading";
type MessageRole = "user" | "assistant";
type MessageTone = "default" | "status" | "error";

interface PreviewWorkspaceProps {
  initialConfig: WebsiteConfig;
  initialDomains: ProjectDomain[];
  initialDomainInstructions: Record<string, DnsInstruction[]>;
  initialHasGeneratedProject: boolean;
  initialMessages: PersistedProjectMessage[];
  initialPageId: string;
  initialProjectName: string;
  initialPublication: PublicationState;
  projectId: string;
  rootDomain: string;
}

interface SiteOperationErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

interface ConversationMessage {
  id: string;
  role: MessageRole;
  text: string;
  tone: MessageTone;
}

interface StarterIdea {
  label: string;
  prompt: string;
}

const MIN_GENERATION_PROMPT_LENGTH = 20;
const MIN_REFINEMENT_PROMPT_LENGTH = 3;
const MAX_PROMPT_LENGTH = 2000;

const starterIdeas: StarterIdea[] = [
  {
    label: "Local service business",
    prompt:
      "Make me a professional website for a trusted local service business with clear services and strong calls to action.",
  },
  {
    label: "Luxury automotive",
    prompt:
      "Make me a premium Las Vegas detailing website called Blackline Auto Spa.",
  },
  {
    label: "Real estate",
    prompt:
      "Create an elegant website for a residential real estate advisor focused on high-touch local service.",
  },
  {
    label: "Restaurant",
    prompt:
      "Create a warm, refined website for a neighborhood restaurant with a seasonal menu and reservations focus.",
  },
  {
    label: "SaaS",
    prompt:
      "Create a clean B2B SaaS website that explains the product clearly and drives qualified demo requests.",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWebsiteConfig(value: unknown): value is WebsiteConfig {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.version !== 2 ||
    !isRecord(value.business) ||
    !isRecord(value.theme) ||
    !Array.isArray(value.navigation) ||
    !Array.isArray(value.pages) ||
    !isRecord(value.footer)
  ) {
    return false;
  }

  const business = value.business;
  const theme = value.theme;
  const businessFields = ["name", "tagline", "phone", "email", "location"];
  if (
    !businessFields.every(
      (field) => typeof business[field] === "string",
    )
  ) {
    return false;
  }

  const themeFields = [
    "style",
    "primaryColor",
    "backgroundColor",
    "textColor",
    "fontStyle",
    "borderRadius",
  ];
  if (!themeFields.every((field) => typeof theme[field] === "string")) {
    return false;
  }

  try {
    return validateWebsiteConfig(value as unknown as WebsiteConfig).length === 0;
  } catch {
    return false;
  }
}

function isSiteOperationErrorResponse(
  payload: unknown,
): payload is SiteOperationErrorResponse {
  return (
    isRecord(payload) &&
    isRecord(payload.error) &&
    typeof payload.error.message === "string"
  );
}

export function PreviewWorkspace({
  initialConfig,
  initialDomains,
  initialDomainInstructions,
  initialHasGeneratedProject,
  initialMessages,
  initialPageId,
  initialProjectName,
  initialPublication,
  projectId,
  rootDomain,
}: PreviewWorkspaceProps) {
  const nextMessageId = useRef(0);
  const autosaveRevision = useRef(0);
  const skipInitialAutosave = useRef(true);
  const mediaCleanupCandidates = useRef(new Set<string>());
  const ownedTemporaryMediaUrls = useRef(new Set<string>());
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [activeMode, setActiveMode] = useState<WorkspaceMode>("preview");
  const [mobileSurface, setMobileSurface] = useState<MobileSurface>("chat");
  const [config, setConfig] = useState<WebsiteConfig>(initialConfig);
  const [currentPageId, setCurrentPageId] = useState(initialPageId);
  const [hasGeneratedProject, setHasGeneratedProject] = useState(initialHasGeneratedProject);
  const [projectName, setProjectName] = useState(initialProjectName);
  const [composerPrompt, setComposerPrompt] = useState("");
  const [operationStatus, setOperationStatus] =
    useState<OperationStatus>("idle");
  const [messages, setMessages] = useState<ConversationMessage[]>(() =>
    initialMessages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.content,
      tone: "default",
    })),
  );
  const [saveStatus, setSaveStatus] = useState<ProjectSaveStatus>("idle");
  const [temporaryMediaCount, setTemporaryMediaCount] = useState(0);
  const [history, setHistory] = useState<WebsiteConfig[]>([initialConfig]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selection, setSelection] = useState<WebsiteSelection | null>(null);
  const [editorActivation, setEditorActivation] = useState(0);
  const [inspectorError, setInspectorError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [publication, setPublication] = useState(initialPublication);
  const [draftHash, setDraftHash] = useState<string | null>(null);
  const [publicationBusy, setPublicationBusy] = useState(false);
  const [publicationError, setPublicationError] = useState<string | null>(null);

  const isBusy = operationStatus === "loading";
  const canUndo = historyIndex > 0 && !isBusy;
  const canRedo = historyIndex < history.length - 1 && !isBusy;
  const minimumPromptLength = hasGeneratedProject
    ? MIN_REFINEMENT_PROMPT_LENGTH
    : MIN_GENERATION_PROMPT_LENGTH;
  const currentPage = config.pages.find((page) => page.id === currentPageId) ?? getHomePage(config);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      try {
        const durable = prepareWebsiteConfigForPersistence(config).config;
        const hash = await hashWebsiteConfig(durable);
        if (active) setDraftHash(hash);
      } catch {
        if (active) setDraftHash(null);
      }
    });
    return () => { active = false; };
  }, [config]);

  useEffect(() => {
    const retained = collectTemporaryMediaUrls(config);
    for (const snapshot of history) {
      for (const url of collectTemporaryMediaUrls(snapshot)) retained.add(url);
    }
    for (const url of ownedTemporaryMediaUrls.current) {
      if (!retained.has(url)) {
        URL.revokeObjectURL(url);
        ownedTemporaryMediaUrls.current.delete(url);
      }
    }
  }, [config, history]);

  useEffect(() => () => {
    for (const url of ownedTemporaryMediaUrls.current) URL.revokeObjectURL(url);
    ownedTemporaryMediaUrls.current.clear();
  }, []);

  useEffect(() => {
    if (skipInitialAutosave.current) {
      skipInitialAutosave.current = false;
      return;
    }
    if (!hasGeneratedProject) return;

    const revision = ++autosaveRevision.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      let durable;
      try {
        durable = prepareWebsiteConfigForPersistence(config);
      } catch {
        if (revision === autosaveRevision.current) setSaveStatus("error");
        return;
      }

      setSaveStatus("saving");
      setTemporaryMediaCount(durable.temporaryMediaCount);
      try {
        const response = await fetch(`/api/projects/${projectId}/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: projectName,
            currentPageId,
            websiteConfig: durable.config,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Project save failed");
        if (revision === autosaveRevision.current) {
          setSaveStatus("saved");
          const retainedPaths = collectStorageMediaPaths(config);
          for (const snapshot of history) {
            for (const path of collectStorageMediaPaths(snapshot)) retainedPaths.add(path);
          }
          for (const path of [...mediaCleanupCandidates.current]) {
            if (retainedPaths.has(path)) continue;
            const cleanupResponse = await fetch(`/api/projects/${projectId}/media`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ storagePath: path }),
            });
            if (cleanupResponse.ok) mediaCleanupCandidates.current.delete(path);
          }
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (revision === autosaveRevision.current) setSaveStatus("error");
      }
    }, 900);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [config, currentPageId, hasGeneratedProject, history, projectId, projectName]);

  function createMessage(
    role: MessageRole,
    text: string,
    tone: MessageTone = "default",
  ): ConversationMessage {
    nextMessageId.current += 1;
    return { id: `local-${nextMessageId.current}`, role, text, tone };
  }

  function commitConfig(nextConfig: WebsiteConfig) {
    const nextIndex = historyIndex + 1;

    const nextPaths = collectStorageMediaPaths(nextConfig);
    for (const path of collectStorageMediaPaths(config)) {
      if (!nextPaths.has(path)) mediaCleanupCandidates.current.add(path);
    }
    for (const discardedSnapshot of history.slice(nextIndex)) {
      for (const path of collectStorageMediaPaths(discardedSnapshot)) {
        if (!nextPaths.has(path)) mediaCleanupCandidates.current.add(path);
      }
    }

    setConfig(nextConfig);
    setHistory((currentHistory) => [
      ...currentHistory.slice(0, nextIndex),
      nextConfig,
    ]);
    setHistoryIndex(nextIndex);
    const retainedPage = nextConfig.pages.find((page) => page.id === currentPageId && page.enabled);
    if (!retainedPage) setCurrentPageId(getHomePage(nextConfig).id);
    if (selection && !selectionExists(nextConfig, selection)) {
      setSelection(null);
      setInspectorError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPrompt = composerPrompt.trim();
    if (normalizedPrompt.length < minimumPromptLength) {
      const guidance = hasGeneratedProject
        ? "Tell me a little more about the change you want."
        : "Describe the business, audience, and kind of site you want to create.";
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage("assistant", guidance, "error"),
      ]);
      return;
    }

    const isRefinement = hasGeneratedProject;
    const statusMessage = isRefinement
      ? "Making that change…"
      : "Creating your first version…";

    setMessages((currentMessages) => [
      ...currentMessages,
      createMessage("user", normalizedPrompt),
      createMessage("assistant", statusMessage, "status"),
    ]);
    setComposerPrompt("");
    setOperationStatus("loading");

    try {
      const response = await fetch(
        isRefinement ? "/api/refine-site" : "/api/generate-site",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRefinement
              ? { projectId, prompt: normalizedPrompt, currentConfig: config }
              : { projectId, prompt: normalizedPrompt },
          ),
        },
      );

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error("I received an unreadable response. Please try again.");
      }

      if (!response.ok) {
        throw new Error(
          isSiteOperationErrorResponse(payload)
            ? payload.error.message
            : "I couldn't complete that request. Please try again.",
        );
      }

      if (!isRecord(payload) || !isWebsiteConfig(payload.config)) {
        throw new Error(
          "The update could not be verified. Your current site is unchanged.",
        );
      }

      const nextConfig = payload.config;
      commitConfig(nextConfig);
      setCurrentPageId((current) => nextConfig.pages.some((page) => page.id === current && page.enabled) ? current : getHomePage(nextConfig).id);
      setHasGeneratedProject(true);
      if (!isRefinement) setProjectName(nextConfig.business.name);
      setMobileSurface("canvas");
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(
          "assistant",
          isRefinement ? "Your site has been updated." : "Your site is ready.",
        ),
      ]);
    } catch (error: unknown) {
      const safeMessage =
        error instanceof Error
          ? error.message
          : "I couldn't complete that request. Please try again.";
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage("assistant", safeMessage, "error"),
      ]);
    } finally {
      setOperationStatus("idle");
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function handleUndo() {
    if (!canUndo) {
      return;
    }

    const nextIndex = historyIndex - 1;
    const nextConfig = history[nextIndex];
    setConfig(nextConfig);
    setHistoryIndex(nextIndex);
    if (!nextConfig.pages.some((page) => page.id === currentPageId && page.enabled)) setCurrentPageId(getHomePage(nextConfig).id);
    if (selection && !selectionExists(nextConfig, selection)) setSelection(null);
  }

  function handleRedo() {
    if (!canRedo) {
      return;
    }

    const nextIndex = historyIndex + 1;
    const nextConfig = history[nextIndex];
    setConfig(nextConfig);
    setHistoryIndex(nextIndex);
    if (!nextConfig.pages.some((page) => page.id === currentPageId && page.enabled)) setCurrentPageId(getHomePage(nextConfig).id);
    if (selection && !selectionExists(nextConfig, selection)) setSelection(null);
  }

  function handleCanvasClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target instanceof Element ? event.target : null;
    if (activeMode === "preview") {
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      const href = anchor?.getAttribute("href");
      if (href?.startsWith("/")) {
        event.preventDefault();
        handleBuilderNavigation(href);
      }
      return;
    }
    if (activeMode !== "edit") return;
    const selectable = target?.closest<HTMLElement>("[data-sitewing-key]");
    if (!selectable) return;
    event.preventDefault();
    event.stopPropagation();
    const nextSelection = parseSelectionKey(selectable.dataset.sitewingKey ?? "");
    if (nextSelection) {
      setSelection(nextSelection);
      setInspectorError(null);
    }
  }

  function handleCanvasDoubleClick(event: MouseEvent<HTMLDivElement>) {
    if (activeMode !== "edit") return;
    const target = event.target instanceof Element ? event.target : null;
    const selectable = target?.closest<HTMLElement>("[data-sitewing-editable='true']");
    if (!selectable) return;
    event.preventDefault();
    const nextSelection = parseSelectionKey(selectable.dataset.sitewingKey ?? "");
    if (nextSelection?.kind === "field" || nextSelection?.kind === "media") {
      setSelection(nextSelection);
      if (nextSelection.kind === "field") setEditorActivation((current) => current + 1);
    }
  }

  function handleCanvasKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (activeMode !== "edit") return;
    if (event.key === "Escape") {
      setSelection(null);
      setInspectorError(null);
      return;
    }
    if (event.key !== "Enter") return;
    const target = event.target instanceof Element ? event.target : null;
    const selectable = target?.closest<HTMLElement>("[data-sitewing-editable='true']");
    if (!selectable) return;
    event.preventDefault();
    const nextSelection = parseSelectionKey(selectable.dataset.sitewingKey ?? "");
    if (nextSelection?.kind === "field" || nextSelection?.kind === "media") {
      setSelection(nextSelection);
      if (nextSelection.kind === "field") setEditorActivation((current) => current + 1);
    }
  }

  function handleManualFieldSave(
    fieldSelection: FieldSelection,
    value: string,
    companionValue?: string,
  ) {
    const firstResult = updateSelectedField(config, fieldSelection, value);
    if (!firstResult.ok) {
      setInspectorError(firstResult.message);
      return;
    }
    let nextConfig = firstResult.config;
    const companion = getCompanionHrefSelection(fieldSelection);
    if (companion && companionValue !== undefined) {
      const companionResult = updateSelectedField(nextConfig, companion, companionValue);
      if (!companionResult.ok) {
        setInspectorError(companionResult.message);
        return;
      }
      nextConfig = companionResult.config;
    }
    commitConfig(nextConfig);
    setInspectorError(null);
  }

  function handleMoveSection(pageId: string, sectionId: string, direction: -1 | 1) {
    const result = moveSection(config, pageId, sectionId, direction);
    if (!result.ok) return setInspectorError(result.message);
    commitConfig(result.config);
    setInspectorError(null);
  }

  function handleSetSectionEnabled(pageId: string, sectionId: string, enabled: boolean) {
    const result = setSectionEnabled(config, pageId, sectionId, enabled);
    if (!result.ok) return setInspectorError(result.message);
    commitConfig(result.config);
    setInspectorError(null);
  }

  function handleSetSectionVariant(pageId: string | undefined, sectionId: string, variant: WebsiteSectionVariant) {
    const result = updateSectionVariant(config, pageId, sectionId, variant);
    if (!result.ok) return setInspectorError(result.message);
    commitConfig(result.config);
    setInspectorError(null);
  }

  async function handleMediaUpload(mediaSelection: MediaSelection, file: File) {
    const existing = getSelectedMedia(config, mediaSelection);
    try {
      const media = await createProjectMediaUploadAdapter(projectId).uploadMedia(file, {
        alt: existing?.kind === "image" ? existing.alt : existing?.label ?? file.name,
        fit: existing?.kind === "image" ? existing.fit : "cover",
      });
      const result = replaceSelectedMedia(config, mediaSelection, media);
      if (!result.ok) {
        if (isPersistentStorageMedia(media)) {
          await fetch(`/api/projects/${projectId}/media`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storagePath: media.storagePath }),
          });
        }
        setInspectorError(result.message);
        return;
      }
      commitConfig(result.config);
      setInspectorError(null);
    } catch (error: unknown) {
      setInspectorError(error instanceof Error ? error.message : "That image could not be uploaded.");
    }
  }

  function handleMediaSave(mediaSelection: MediaSelection, details: Parameters<typeof updateSelectedMediaDetails>[2]) {
    const result = updateSelectedMediaDetails(config, mediaSelection, details);
    if (!result.ok) return setInspectorError(result.message);
    commitConfig(result.config);
    setInspectorError(null);
  }

  function handleMediaRemove(mediaSelection: MediaSelection) {
    const result = removeSelectedMedia(config, mediaSelection);
    if (!result.ok) return setInspectorError(result.message);
    commitConfig(result.config);
    setInspectorError(null);
  }

  function handleMoveGalleryItem(mediaSelection: MediaSelection, direction: -1 | 1) {
    const result = moveSelectedGalleryItem(config, mediaSelection, direction);
    if (!result.ok) return setInspectorError(result.message);
    commitConfig(result.config);
    setInspectorError(null);
  }

  function handleBuilderNavigation(href: string) {
    const page = getPageByHref(config, href);
    if (!page) return;
    setCurrentPageId(page.id);
    setSelection(null);
    setInspectorError(null);
  }

  function applyPageOperation(result: ReturnType<typeof movePage>, nextPageId?: string) {
    if (!result.ok) return setPageError(result.message);
    commitConfig(result.config);
    if (nextPageId && result.config.pages.some((page) => page.id === nextPageId && page.enabled)) setCurrentPageId(nextPageId);
    setPageError(null);
    setSelection(null);
  }

  function handleUpdatePage(pageId: string, title: string, navLabel: string) {
    applyPageOperation(updatePageMetadata(config, pageId, title, navLabel), pageId);
  }

  function handleMovePage(pageId: string, direction: -1 | 1) {
    applyPageOperation(movePage(config, pageId, direction), pageId);
  }

  function handleTogglePage(pageId: string, enabled: boolean) {
    applyPageOperation(setPageEnabled(config, pageId, enabled), enabled ? pageId : getHomePage(config).id);
  }

  function handleAddPage(name: string) {
    const result = addBasicPage(config, name);
    applyPageOperation(result, result.ok ? result.config.pages.at(-1)?.id : undefined);
  }

  function handleRemovePage(pageId: string) {
    applyPageOperation(removePage(config, pageId), getHomePage(config).id);
  }

  async function handlePublication(action: "publish" | "unpublish") {
    setPublicationBusy(true);
    setPublicationError(null);
    try {
      if (action === "publish") {
        const durable = prepareWebsiteConfigForPersistence(config);
        const saveResponse = await fetch(`/api/projects/${projectId}/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: projectName, currentPageId, websiteConfig: durable.config }),
        });
        if (!saveResponse.ok) throw new Error("Your latest draft could not be saved, so it was not published.");
        setSaveStatus("saved");
      }
      const response = await fetch(`/api/projects/${projectId}/publication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json() as PublicationResponse | SiteOperationErrorResponse;
      if (!response.ok || !("isActive" in payload)) throw new Error(isSiteOperationErrorResponse(payload) ? payload.error.message : "Publishing failed. Please try again.");
      setPublication({ publicSlug: payload.publicSlug, isActive: payload.isActive, configHash: payload.configHash, publishedAt: payload.publishedAt });
    } catch (error: unknown) {
      setPublicationError(error instanceof Error ? error.message : "Publishing failed. Please try again.");
    } finally {
      setPublicationBusy(false);
    }
  }

  const publicationUnchanged = publication.isActive && Boolean(draftHash) && draftHash === publication.configHash;
  const publishLabel = publicationBusy
    ? "Publishing…"
    : publicationUnchanged
      ? "Published"
      : publication.isActive
        ? "Publish changes"
        : publication.publicSlug
          ? "Republish"
          : "Publish";

  return (
    <div className={styles.workspace}>
      <header className={styles.topBar}>
        <div className={styles.topBarIdentity}>
          <Link href="/dashboard" className={styles.backButton} aria-label="Back to dashboard">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m12.5 4.5-5.5 5.5 5.5 5.5" />
            </svg>
          </Link>
          <BrandMark />
          <span className={styles.topBarDivider} aria-hidden="true" />
          <div className={styles.projectIdentity}>
            <strong>{projectName}</strong>
            <span
              role={saveStatus === "error" ? "status" : undefined}
              title={temporaryMediaCount > 0 ? "Temporary browser images are not stored as durable media." : undefined}
            >
              {isBusy
                ? "Updating…"
                : saveStatus === "saving"
                  ? "Saving…"
                  : saveStatus === "saved"
                    ? temporaryMediaCount > 0 ? "Saved · image temporary" : "Saved"
                    : saveStatus === "error"
                      ? "Save error"
                      : "Ready"}
            </span>
          </div>
        </div>

        <div className={styles.topBarCenter}>
          <div className={styles.tabControls} aria-label="Workspace view">
            <button
              type="button"
              aria-pressed={activeMode === "preview"}
              onClick={() => setActiveMode("preview")}
            >
              Preview
            </button>
            <button
              type="button"
              aria-pressed={activeMode === "edit"}
              onClick={() => setActiveMode("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              aria-pressed={activeMode === "code"}
              onClick={() => setActiveMode("code")}
            >
              Code
            </button>
          </div>
        </div>

        <div className={styles.topBarActions}>
          {hasGeneratedProject ? (
            <div className={styles.publicationControls}>
              {publication.isActive && publication.publicSlug ? <a href={`https://${publication.publicSlug}.${rootDomain}`} target="_blank" rel="noreferrer">View site</a> : null}
              {publication.isActive ? <button type="button" className={styles.unpublishButton} disabled={publicationBusy} onClick={() => void handlePublication("unpublish")}>Unpublish</button> : null}
              <button type="button" className={styles.publishButton} disabled={publicationBusy || publicationUnchanged || !draftHash} onClick={() => void handlePublication("publish")}>{publishLabel}</button>
              {publicationError ? <span role="alert" title={publicationError}>Publishing failed</span> : null}
            </div>
          ) : null}
          <div className={styles.historyControls} aria-label="Edit history">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              aria-label="Undo last change"
              title="Undo"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M7.5 5 3.5 9l4 4" />
                <path d="M4 9h7a5 5 0 0 1 5 5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              aria-label="Redo last change"
              title="Redo"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m12.5 5 4 4-4 4" />
                <path d="M16 9H9a5 5 0 0 0-5 5" />
              </svg>
            </button>
          </div>

          {activeMode !== "code" ? (
            <div className={styles.viewportControls} aria-label="Preview size">
              <button
                type="button"
                aria-label="Show desktop preview"
                aria-pressed={previewMode === "desktop"}
                onClick={() => setPreviewMode("desktop")}
                title="Desktop"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <rect x="2.5" y="3.5" width="15" height="10" rx="1" />
                  <path d="M7 16.5h6M10 13.5v3" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Show tablet preview"
                aria-pressed={previewMode === "tablet"}
                onClick={() => setPreviewMode("tablet")}
                title="Tablet"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <rect x="4.5" y="2.5" width="11" height="15" rx="1.5" />
                  <path d="M9 14.8h2" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Show mobile preview"
                aria-pressed={previewMode === "mobile"}
                onClick={() => setPreviewMode("mobile")}
                title="Mobile"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <rect x="6" y="2" width="8" height="16" rx="1.5" />
                  <path d="M9 15.5h2" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.mobileSwitcher} aria-label="Mobile workspace view">
        <button type="button" aria-pressed={mobileSurface === "chat"} onClick={() => setMobileSurface("chat")}>Chat</button>
        <button type="button" aria-pressed={mobileSurface === "canvas"} onClick={() => setMobileSurface("canvas")}>Canvas</button>
      </div>

      <div className={styles.builderBody}>
        <aside className={`${styles.conversationPanel} ${mobileSurface === "canvas" ? styles.mobileHidden : ""}`} aria-label="AI web designer">
          <div className={styles.conversationHeader}>
            <div className={styles.designerMark} aria-hidden="true">
              S
            </div>
            <div>
              <h1>AI web designer</h1>
              <p>Describe what you want. Refine it as you go.</p>
            </div>
          </div>

          <div className={styles.conversationContent} aria-live="polite">
            {messages.length === 0 ? (
              <div className={styles.conversationEmpty}>
                <div>
                  <p className={styles.emptyEyebrow}>Start with an idea</p>
                  <h2>Describe the website you want to build.</h2>
                  <p>
                    Share the business, audience, services, and the feeling you
                    want the site to have.
                  </p>
                </div>
                <div className={styles.starterIdeas} aria-label="Starter ideas">
                  {starterIdeas.map((idea) => (
                    <button
                      key={idea.label}
                      type="button"
                      onClick={() => setComposerPrompt(idea.prompt)}
                    >
                      <span>{idea.label}</span>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="m7.5 4.5 5.5 5.5-5.5 5.5" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.messageList}>
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`${styles.message} ${
                      message.role === "user"
                        ? styles.userMessage
                        : styles.assistantMessage
                    } ${
                      message.tone === "status"
                        ? styles.statusMessage
                        : message.tone === "error"
                          ? styles.errorMessage
                          : ""
                    }`}
                  >
                    <p className={styles.messageAuthor}>
                      {message.role === "user" ? "You" : "SiteWing"}
                    </p>
                    <p>{message.text}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            <label className={styles.srOnly} htmlFor="site-prompt">
              Tell SiteWing what to build or change
            </label>
            <textarea
              id="site-prompt"
              name="prompt"
              value={composerPrompt}
              onChange={(event) => setComposerPrompt(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              maxLength={MAX_PROMPT_LENGTH}
              disabled={isBusy}
              placeholder={
                hasGeneratedProject
                  ? "Ask SiteWing to change anything…"
                  : "Describe your website…"
              }
              rows={3}
            />
            <div className={styles.composerFooter}>
              <span>Enter to send · Shift + Enter for a new line</span>
              <button
                type="submit"
                disabled={isBusy || composerPrompt.trim().length === 0}
                aria-label={isBusy ? "SiteWing is working" : "Send message"}
              >
                {isBusy ? (
                  <span className={styles.spinner} aria-hidden="true" />
                ) : (
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4 10h12M11 5l5 5-5 5" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </aside>

        <main className={`${styles.workspaceMain} ${mobileSurface === "chat" ? styles.mobileHidden : ""}`}>
          <DomainManager initialDomains={initialDomains} initialInstructions={initialDomainInstructions} isPublished={publication.isActive} projectId={projectId} publicSlug={publication.publicSlug} rootDomain={rootDomain} />
          {hasGeneratedProject ? (
            <PageToolbar
              currentPageId={currentPage.id}
              error={pageError}
              onAdd={handleAddPage}
              onMove={handleMovePage}
              onRemove={handleRemovePage}
              onSelect={(pageId) => { setCurrentPageId(pageId); setSelection(null); setPageError(null); }}
              onToggle={handleTogglePage}
              onUpdate={handleUpdatePage}
              pages={config.pages}
            />
          ) : null}
          <div className={styles.workspaceSurface}>
          {activeMode !== "code" ? (
            <div className={styles.previewCanvas}>
              {hasGeneratedProject ? (
                <div
                  className={`${styles.previewViewport} ${
                    previewMode === "mobile"
                      ? styles.mobileViewport
                      : previewMode === "tablet"
                        ? styles.tabletViewport
                        : styles.desktopViewport
                  }`}
                  data-preview-mode={previewMode}
                  onClickCapture={handleCanvasClick}
                  onDoubleClickCapture={handleCanvasDoubleClick}
                  onKeyDownCapture={handleCanvasKeyDown}
                >
                  <SiteRenderer
                    config={config}
                    currentPageId={currentPage.id}
                    onNavigate={handleBuilderNavigation}
                    editor={activeMode === "edit" ? {
                      enabled: true,
                      pageId: currentPage.id,
                      selectedKey: selection ? getSelectionKey(selection) : undefined,
                    } : undefined}
                  />
                </div>
              ) : (
                <section className={styles.previewEmpty}>
                  <div className={styles.emptyCanvasMark} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <h2>Your site will appear here.</h2>
                  <p>
                    Start a conversation and SiteWing will build the first
                    version.
                  </p>
                </section>
              )}
              {activeMode === "edit" && selection ? (
                <SelectionInspector
                  activation={editorActivation}
                  config={config}
                  error={inspectorError}
                  onClose={() => { setSelection(null); setInspectorError(null); }}
                  onFieldSave={handleManualFieldSave}
                  onMoveSection={handleMoveSection}
                  onMediaRemove={handleMediaRemove}
                  onMediaSave={handleMediaSave}
                  onMediaUpload={handleMediaUpload}
                  onMoveGalleryItem={handleMoveGalleryItem}
                  onSetSectionEnabled={handleSetSectionEnabled}
                  onSetSectionVariant={handleSetSectionVariant}
                  selection={selection}
                />
              ) : null}
            </div>
          ) : (
            <section className={styles.codeWorkspace} aria-label="Site structure">
              <div className={styles.codeHeader}>
                <div>
                  <p>Site structure</p>
                  <h2>{projectName}</h2>
                </div>
                <span>Read only</span>
              </div>
              {hasGeneratedProject ? (
                <pre tabIndex={0}>
                  <code>{JSON.stringify({ currentPageId: currentPage.id, currentPage, siteConfig: config }, null, 2)}</code>
                </pre>
              ) : (
                <div className={styles.codeEmpty}>
                  <h3>Nothing to show yet.</h3>
                  <p>Generate your first site to inspect its structure.</p>
                </div>
              )}
            </section>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
