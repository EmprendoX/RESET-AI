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
      users_profile: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users_profile"]["Insert"]>;
      };
      coach_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          language: string;
          timezone: string | null;
          main_focus: string | null;
          coaching_style: string | null;
          onboarding_completed: boolean;
          memory_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          language?: string;
          timezone?: string | null;
          main_focus?: string | null;
          coaching_style?: string | null;
          onboarding_completed?: boolean;
          memory_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coach_profiles"]["Insert"]>;
      };
      onboarding_forms: {
        Row: {
          id: string;
          user_id: string;
          answers_json: Json;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          answers_json?: Json;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["onboarding_forms"]["Insert"]>;
      };
      business_profiles: {
        Row: {
          id: string;
          user_id: string;
          has_business: boolean;
          business_name: string | null;
          business_type: string | null;
          offer: string | null;
          ideal_customer: string | null;
          main_channel: string | null;
          monthly_goal: string | null;
          main_blocker: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          has_business?: boolean;
          business_name?: string | null;
          business_type?: string | null;
          offer?: string | null;
          ideal_customer?: string | null;
          main_channel?: string | null;
          monthly_goal?: string | null;
          main_blocker?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_profiles"]["Insert"]>;
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          target_date: string | null;
          status: string;
          progress: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          target_date?: string | null;
          status?: string;
          progress?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
          metadata_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
          metadata_json?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          source: string;
          confidence: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          source?: string;
          confidence?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["memories"]["Insert"]>;
      };
      recommendations: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          description: string | null;
          reason: string | null;
          status: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          description?: string | null;
          reason?: string | null;
          status?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recommendations"]["Insert"]>;
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          answers_json: Json;
          summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          answers_json?: Json;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["check_ins"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          due_date: string | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: string;
          due_date?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      user_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          source: string;
          object_type: string | null;
          object_id: string | null;
          metadata_json: Json | null;
          occurred_at: string;
          received_at: string;
          idempotency_key: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          source?: string;
          object_type?: string | null;
          object_id?: string | null;
          metadata_json?: Json | null;
          occurred_at?: string;
          received_at?: string;
          idempotency_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_events"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata_json?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
      feature_flags: {
        Row: {
          id: string;
          key: string;
          enabled: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          enabled?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["feature_flags"]["Insert"]>;
      };
      usage_counters: {
        Row: {
          id: string;
          user_id: string;
          day: string;
          coach_messages: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day: string;
          coach_messages?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["usage_counters"]["Insert"]>;
      };
    };
  };
}
