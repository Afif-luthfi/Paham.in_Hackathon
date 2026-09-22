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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          class_id: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      class_access: {
        Row: {
          class_id: string
          meeting_url: string
        }
        Insert: {
          class_id: string
          meeting_url: string
        }
        Update: {
          class_id?: string
          meeting_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_access_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: true
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_materials: {
        Row: {
          class_id: string
          created_at: string
          external_url: string | null
          id: string
          storage_path: string | null
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          external_url?: string | null
          id?: string
          storage_path?: string | null
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          external_url?: string | null
          id?: string
          storage_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_reviews: {
        Row: {
          booking_id: string
          comment: string
          created_at: string
          rating: number
        }
        Insert: {
          booking_id: string
          comment?: string
          created_at?: string
          rating: number
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          category_id: string
          created_at: string
          description: string
          duration_minutes: number
          id: string
          location: string
          max_quota: number
          mentor_id: string
          price: number
          reserved_seats: number
          starts_at: string
          status: string
          title: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description: string
          duration_minutes: number
          id?: string
          location: string
          max_quota?: number
          mentor_id: string
          price?: number
          reserved_seats?: number
          starts_at: string
          status?: string
          title: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          location?: string
          max_quota?: number
          mentor_id?: string
          price?: number
          reserved_seats?: number
          starts_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          approved_at: string
          avatar_url: string | null
          display_name: string
          major: string
          user_id: string
        }
        Insert: {
          approved_at?: string
          avatar_url?: string | null
          display_name: string
          major: string
          user_id: string
        }
        Update: {
          approved_at?: string
          avatar_url?: string | null
          display_name?: string
          major?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_profiles_major_fkey"
            columns: ["major"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_verifications: {
        Row: {
          category_id: string
          contact: string
          created_at: string
          file_name: string
          file_size: number
          gpa: number
          id: string
          review_notes: string | null
          reviewed_at: string | null
          status: string
          transcript_path: string
          user_id: string
        }
        Insert: {
          category_id: string
          contact: string
          created_at?: string
          file_name: string
          file_size: number
          gpa: number
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          transcript_path: string
          user_id: string
        }
        Update: {
          category_id?: string
          contact?: string
          created_at?: string
          file_name?: string
          file_size?: number
          gpa?: number
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          transcript_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_verifications_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          method: string
          paid_at: string | null
          provider_reference: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          method?: string
          paid_at?: string | null
          provider_reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          method?: string
          paid_at?: string | null
          provider_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          major: string
          name: string
          nim: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          major: string
          name: string
          nim: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          major?: string
          name?: string
          nim?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_major_fkey"
            columns: ["major"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          mentor_id: string
          payment_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          mentor_id: string
          payment_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          mentor_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_entries_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentor_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          channel: string
          created_at: string
          destination: string
          id: string
          mentor_id: string
          processed_at: string | null
          status: string
        }
        Insert: {
          amount: number
          channel: string
          created_at?: string
          destination: string
          id?: string
          mentor_id: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          channel?: string
          created_at?: string
          destination?: string
          id?: string
          mentor_id?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_class: {
        Args: {
          p_category: string
          p_description: string
          p_duration: number
          p_location: string
          p_starts_at: string
          p_title: string
          p_url: string
        }
        Returns: string
      }
      request_withdrawal: {
        Args: { p_amount: number; p_channel: string; p_destination: string }
        Returns: string
      }
      reserve_class: { Args: { p_class_id: string }; Returns: string }
      settle_payment: {
        Args: { p_payment_id: string; p_provider_reference: string }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
