import type { HTMLAttributes } from "react";

import { getSelectionKey } from "@/lib/website-config-editor";
import { getSectionVariant } from "@/lib/website-design-system";
import type { WebsiteSection } from "@/types/website";
import type { RendererEditorState, WebsiteSelection } from "@/types/website-editor";

type EditorAttributes = HTMLAttributes<HTMLElement> & {
  "data-sitewing-key"?: string;
  "data-sitewing-editable"?: "true";
  "data-sitewing-selected"?: "true";
};

export function layoutAttributes(section: WebsiteSection): { "data-layout"?: string } {
  return { "data-layout": getSectionVariant(section) };
}

export function editableAttributes(
  editor: RendererEditorState | undefined,
  selection: WebsiteSelection,
): EditorAttributes {
  if (!editor?.enabled) return {};
  const key = getSelectionKey({ ...selection, pageId: selection.pageId ?? editor.pageId });
  return {
    "data-sitewing-key": key,
    "data-sitewing-editable": "true",
    "data-sitewing-selected": editor.selectedKey === key ? "true" : undefined,
    tabIndex: 0,
  };
}

export function sectionAttributes(
  editor: RendererEditorState | undefined,
  sectionId: string,
): EditorAttributes {
  if (!editor?.enabled) return {};
  const key = getSelectionKey({ kind: "section", sectionId, pageId: editor.pageId });
  return {
    "data-sitewing-key": key,
    "data-sitewing-selected": editor.selectedKey === key ? "true" : undefined,
  };
}
