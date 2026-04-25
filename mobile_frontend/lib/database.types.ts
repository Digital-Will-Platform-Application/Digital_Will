export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.1" }
  public: {
    Tables: {
      asset_allocations: {
        Row: { allocation_percentage: number; asset_id: string; created_at: string; id: string; notes: string | null; recipient_id: string }
        Insert: { allocation_percentage: number; asset_id: string; created_at?: string; id?: string; notes?: string | null; recipient_id: string }
        Update: { allocation_percentage?: number; asset_id?: string; created_at?: string; id?: string; notes?: string | null; recipient_id?: string }
        Relationships: unknown[]
      }
      assets: {
        Row: { category: Database["public"]["Enums"]["asset_category"]; created_at: string; currency: string | null; description: string | null; documents_url: string | null; estimated_value: number | null; id: string; location: string | null; name: string; updated_at: string; user_id: string; will_id: string | null }
        Insert: { category?: Database["public"]["Enums"]["asset_category"]; created_at?: string; currency?: string | null; description?: string | null; documents_url?: string | null; estimated_value?: number | null; id?: string; location?: string | null; name: string; updated_at?: string; user_id: string; will_id?: string | null }
        Update: { category?: Database["public"]["Enums"]["asset_category"]; created_at?: string; currency?: string | null; description?: string | null; documents_url?: string | null; estimated_value?: number | null; id?: string; location?: string | null; name?: string; updated_at?: string; user_id?: string; will_id?: string | null }
        Relationships: unknown[]
      }
      admin_emails: {
        Row: { email: string; role: "super_admin" | "admin"; created_at: string }
        Insert: { email: string; role?: "super_admin" | "admin"; created_at?: string }
        Update: { email?: string; role?: "super_admin" | "admin"; created_at?: string }
        Relationships: unknown[]
      }
      login_activity: { Row: { id: string; user_id: string; email: string | null; logged_at: string }; Insert: { id?: string; user_id: string; email?: string | null; logged_at?: string }; Update: { id?: string; user_id?: string; email?: string | null; logged_at?: string }; Relationships: unknown[] }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; email: string | null; full_name: string | null; id: string; phone: string | null; updated_at: string; user_id: string }
        Insert: { avatar_url?: string | null; created_at?: string; email?: string | null; full_name?: string | null; id?: string; phone?: string | null; updated_at?: string; user_id: string }
        Update: { avatar_url?: string | null; created_at?: string; email?: string | null; full_name?: string | null; id?: string; phone?: string | null; updated_at?: string; user_id?: string }
        Relationships: unknown[]
      }
      recipients: {
        Row: { address: string | null; created_at: string; email: string | null; full_name: string; id: string; is_verified: boolean; phone: string | null; relationship: string | null; updated_at: string; user_id: string; verification_code: string | null }
        Insert: { address?: string | null; created_at?: string; email?: string | null; full_name: string; id?: string; is_verified?: boolean; phone?: string | null; relationship?: string | null; updated_at?: string; user_id: string; verification_code?: string | null }
        Update: { address?: string | null; created_at?: string; email?: string | null; full_name?: string; id?: string; is_verified?: boolean; phone?: string | null; relationship?: string | null; updated_at?: string; user_id?: string; verification_code?: string | null }
        Relationships: unknown[]
      }
      reminders: {
        Row: { id: string; user_id: string; title: string; description: string | null; reminder_type: string; frequency: string; next_reminder_date: string; is_active: boolean; email_notification: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title: string; description?: string | null; reminder_type?: string; frequency?: string; next_reminder_date: string; is_active?: boolean; email_notification?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; description?: string | null; reminder_type?: string; frequency?: string; next_reminder_date?: string; is_active?: boolean; email_notification?: boolean; created_at?: string; updated_at?: string }
        Relationships: unknown[]
      }
      wills: {
        Row: { audio_url: string | null; content: string | null; created_at: string; id: string; notes: string | null; status: Database["public"]["Enums"]["will_status"]; title: string; transcript: string | null; type: Database["public"]["Enums"]["will_type"]; updated_at: string; user_id: string; video_url: string | null }
        Insert: { audio_url?: string | null; content?: string | null; created_at?: string; id?: string; notes?: string | null; status?: Database["public"]["Enums"]["will_status"]; title?: string; transcript?: string | null; type?: Database["public"]["Enums"]["will_type"]; updated_at?: string; user_id: string; video_url?: string | null }
        Update: { audio_url?: string | null; content?: string | null; created_at?: string; id?: string; notes?: string | null; status?: Database["public"]["Enums"]["will_status"]; title?: string; transcript?: string | null; type?: Database["public"]["Enums"]["will_type"]; updated_at?: string; user_id?: string; video_url?: string | null }
        Relationships: unknown[]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      asset_category: "property" | "investment" | "bank_account" | "vehicle" | "jewelry" | "digital_asset" | "insurance" | "business" | "other"
      will_status: "draft" | "in_progress" | "review" | "completed"
      will_type: "audio" | "video" | "chat" | "text"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
