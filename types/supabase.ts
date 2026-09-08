export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          website_config: Json | null;
          current_page_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          website_config?: Json | null;
          current_page_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          website_config?: Json | null;
          current_page_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_messages: {
        Row: {
          id: string;
          project_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: {
          role?: "user" | "assistant";
          content?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      published_sites: {
        Row: { project_id: string; user_id: string; public_slug: string; published_config: Json; config_hash: string; is_active: boolean; created_at: string; updated_at: string; published_at: string };
        Insert: { project_id: string; user_id: string; public_slug: string; published_config: Json; config_hash: string; is_active?: boolean; created_at?: string; updated_at?: string; published_at?: string };
        Update: { published_config?: Json; config_hash?: string; is_active?: boolean; published_at?: string };
        Relationships: [];
      };
      published_site_assets: {
        Row: { project_id: string; asset_id: string; storage_path: string };
        Insert: { project_id: string; asset_id: string; storage_path: string };
        Update: { project_id?: string; asset_id?: string; storage_path?: string };
        Relationships: [];
      };
      domains: {
        Row: { id: string; project_id: string; user_id: string; hostname: string; type: "sitewing_subdomain" | "custom"; status: "pending" | "verifying" | "active" | "error"; verification_token: string; verified_at: string | null; provider_synced_at: string | null; last_error: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; project_id: string; user_id: string; hostname: string; type: "sitewing_subdomain" | "custom"; status: "pending" | "verifying" | "active" | "error"; verification_token: string; verified_at?: string | null; provider_synced_at?: string | null; last_error?: string | null; created_at?: string; updated_at?: string };
        Update: { hostname?: string; status?: "pending" | "verifying" | "active" | "error"; verified_at?: string | null; provider_synced_at?: string | null; last_error?: string | null };
        Relationships: [];
      };
      billing_accounts: {
        Row: {
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          status: "none" | "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          last_stripe_event_created_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          status?: "none" | "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          last_stripe_event_created_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_customer_id?: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          status?: "none" | "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "paused" | "trialing" | "unpaid";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          last_stripe_event_created_at?: string | null;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: { event_id: string; event_type: string; stripe_created_at: string; processed_at: string };
        Insert: { event_id: string; event_type: string; stripe_created_at: string; processed_at?: string };
        Update: Record<never, never>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      publish_project: {
        Args: { p_project_id: string; p_public_slug_base: string; p_published_config: Json; p_config_hash: string; p_storage_paths: string[] };
        Returns: { public_slug: string; published_at: string }[];
      };
      apply_stripe_subscription_event: {
        Args: {
          p_event_id: string;
          p_event_type: string;
          p_event_created_at: string;
          p_user_id: string;
          p_stripe_customer_id: string;
          p_stripe_subscription_id: string;
          p_stripe_price_id: string | null;
          p_status: string;
          p_current_period_start: string | null;
          p_current_period_end: string | null;
          p_cancel_at_period_end: boolean;
        };
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
