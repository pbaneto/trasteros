export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      payments: {
        Row: {
          billing_cycle_end: string | null
          billing_cycle_start: string | null
          id: string
          is_subscription_active: boolean | null
          months_paid: number | null
          next_billing_date: string | null
          payment_date: string | null
          payment_method: string
          payment_type: string | null
          rental_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          total_amount: number | null
          unit_price: number | null
        }
        Insert: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          id?: string
          is_subscription_active?: boolean | null
          months_paid?: number | null
          next_billing_date?: string | null
          payment_date?: string | null
          payment_method: string
          payment_type?: string | null
          rental_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          total_amount?: number | null
          unit_price?: number | null
        }
        Update: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          id?: string
          is_subscription_active?: boolean | null
          months_paid?: number | null
          next_billing_date?: string | null
          payment_date?: string | null
          payment_method?: string
          payment_type?: string | null
          rental_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          total_amount?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      rentals: {
        Row: {
          checkout_session_id: string | null
          created_at: string | null
          end_date: string
          id: string
          months_paid: number | null
          next_payment_date: string | null
          payment_type: string | null
          price: number
          start_date: string
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          subscription_metadata: Json | null
          subscription_status: string | null
          ttlock_code: string | null
          unit_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          checkout_session_id?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          months_paid?: number | null
          next_payment_date?: string | null
          payment_type?: string | null
          price: number
          start_date: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          subscription_metadata?: Json | null
          subscription_status?: string | null
          ttlock_code?: string | null
          unit_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          checkout_session_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          months_paid?: number | null
          next_payment_date?: string | null
          payment_type?: string | null
          price?: number
          start_date?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          subscription_metadata?: Json | null
          subscription_status?: string | null
          ttlock_code?: string | null
          unit_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rentals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "storage_units"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_units: {
        Row: {
          created_at: string | null
          id: string
          price: number
          size_m2: number
          status: string | null
          unit_number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          price: number
          size_m2: number
          status?: string | null
          unit_number: string
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number
          size_m2?: number
          status?: string | null
          unit_number?: string
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          active: boolean
          billing_municipality: string | null
          billing_name: string | null
          billing_nif_cif: string | null
          billing_postal_code: string | null
          billing_province: string | null
          billing_same_as_personal: boolean | null
          billing_street: string | null
          billing_street_number: string | null
          billing_type: string | null
          created_at: string | null
          dni: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          municipality: string | null
          phone: string | null
          phone_verified: boolean | null
          postal_code: string | null
          province: string | null
          street: string | null
          street_number: string | null
          updated_at: string | null
          verification_code: string | null
          verification_code_expires_at: string | null
        }
        Insert: {
          active?: boolean
          billing_municipality?: string | null
          billing_name?: string | null
          billing_nif_cif?: string | null
          billing_postal_code?: string | null
          billing_province?: string | null
          billing_same_as_personal?: boolean | null
          billing_street?: string | null
          billing_street_number?: string | null
          billing_type?: string | null
          created_at?: string | null
          dni?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          municipality?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          postal_code?: string | null
          province?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Update: {
          active?: boolean
          billing_municipality?: string | null
          billing_name?: string | null
          billing_nif_cif?: string | null
          billing_postal_code?: string | null
          billing_province?: string | null
          billing_same_as_personal?: boolean | null
          billing_street?: string | null
          billing_street_number?: string | null
          billing_type?: string | null
          created_at?: string | null
          dni?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          municipality?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          postal_code?: string | null
          province?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_rental_end_date: {
        Args: { months_paid: number; payment_type: string; start_date: string }
        Returns: string
      }
      deactivate_user_account: {
        Args: Record<PropertyKey, never>
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

