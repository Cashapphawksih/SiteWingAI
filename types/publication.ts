export interface PublicationState {
  publicSlug: string | null;
  isActive: boolean;
  configHash: string | null;
  publishedAt: string | null;
}

export interface PublicationResponse extends PublicationState {
  publicUrl: string | null;
}
