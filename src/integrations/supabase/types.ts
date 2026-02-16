export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ado_connections: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          organization: string
          pat: string
          projects: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization: string
          pat: string
          projects?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization?: string
          pat?: string
          projects?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ado_scan_results: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          project_name: string
          recommendations: Json
          repository_name: string
          scan_type: string
          severity_summary: Json
          status: string
          user_id: string
          vulnerabilities: Json
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          project_name: string
          recommendations?: Json
          repository_name: string
          scan_type: string
          severity_summary?: Json
          status?: string
          user_id: string
          vulnerabilities?: Json
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          project_name?: string
          recommendations?: Json
          repository_name?: string
          scan_type?: string
          severity_summary?: Json
          status?: string
          user_id?: string
          vulnerabilities?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ado_scan_results_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ado_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      clusters: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kubeconfig: string
          name: string
          server_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kubeconfig: string
          name: string
          server_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kubeconfig?: string
          name?: string
          server_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monitor_checks: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          monitor_id: string
          response_time_ms: number | null
          status: string
          status_code: number | null
          tls_expiry_days: number | null
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          monitor_id: string
          response_time_ms?: number | null
          status: string
          status_code?: number | null
          tls_expiry_days?: number | null
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          monitor_id?: string
          response_time_ms?: number | null
          status?: string
          status_code?: number | null
          tls_expiry_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monitor_checks_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      monitors: {
        Row: {
          alert_channels: Json | null
          alert_severity: string | null
          auth_credentials: string | null
          auth_type: string | null
          business_hours: string | null
          check_interval_seconds: number
          consecutive_failures: number
          consecutive_successes: number
          created_at: string
          current_status: string
          custom_headers: Json | null
          description: string | null
          endpoint: string
          environment: string
          expected_body_match: string | null
          expected_status_code: number | null
          failure_threshold: number
          http_method: string | null
          id: string
          is_active: boolean
          last_checked_at: string | null
          latency_critical_ms: number | null
          latency_warning_ms: number | null
          maintenance_end: string | null
          maintenance_start: string | null
          monitor_type: string
          monitoring_region: string | null
          name: string
          notify_on: string[] | null
          owner: string | null
          port: number | null
          recovery_threshold: number
          request_path: string | null
          retry_count: number
          sla_target: number | null
          tags: Json
          timeout_seconds: number
          tls_check_enabled: boolean | null
          tls_expiry_alert_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_channels?: Json | null
          alert_severity?: string | null
          auth_credentials?: string | null
          auth_type?: string | null
          business_hours?: string | null
          check_interval_seconds?: number
          consecutive_failures?: number
          consecutive_successes?: number
          created_at?: string
          current_status?: string
          custom_headers?: Json | null
          description?: string | null
          endpoint: string
          environment?: string
          expected_body_match?: string | null
          expected_status_code?: number | null
          failure_threshold?: number
          http_method?: string | null
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          latency_critical_ms?: number | null
          latency_warning_ms?: number | null
          maintenance_end?: string | null
          maintenance_start?: string | null
          monitor_type?: string
          monitoring_region?: string | null
          name: string
          notify_on?: string[] | null
          owner?: string | null
          port?: number | null
          recovery_threshold?: number
          request_path?: string | null
          retry_count?: number
          sla_target?: number | null
          tags?: Json
          timeout_seconds?: number
          tls_check_enabled?: boolean | null
          tls_expiry_alert_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_channels?: Json | null
          alert_severity?: string | null
          auth_credentials?: string | null
          auth_type?: string | null
          business_hours?: string | null
          check_interval_seconds?: number
          consecutive_failures?: number
          consecutive_successes?: number
          created_at?: string
          current_status?: string
          custom_headers?: Json | null
          description?: string | null
          endpoint?: string
          environment?: string
          expected_body_match?: string | null
          expected_status_code?: number | null
          failure_threshold?: number
          http_method?: string | null
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          latency_critical_ms?: number | null
          latency_warning_ms?: number | null
          maintenance_end?: string | null
          maintenance_start?: string | null
          monitor_type?: string
          monitoring_region?: string | null
          name?: string
          notify_on?: string[] | null
          owner?: string | null
          port?: number | null
          recovery_threshold?: number
          request_path?: string | null
          retry_count?: number
          sla_target?: number | null
          tags?: Json
          timeout_seconds?: number
          tls_check_enabled?: boolean | null
          tls_expiry_alert_days?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_clusters: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          server_url: string
          status: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
