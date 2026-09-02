export interface PersistedProjectMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export type ProjectSaveStatus = "idle" | "saving" | "saved" | "error";
