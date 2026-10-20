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
      app_downloads: {
        Row: {
          created_at: string
          download_url: string | null
          id: string
          is_active: boolean | null
          platform: string
          version: string | null
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          version?: string | null
        }
        Update: {
          created_at?: string
          download_url?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          version?: string | null
        }
        Relationships: []
      }
      chat_logs: {
        Row: {
          created_at: string
          id: string
          language: string | null
          message: string
          response: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          message: string
          response?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          message?: string
          response?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crop_disease_reports: {
        Row: {
          confidence_score: number | null
          created_at: string
          disease_name: string
          id: string
          image_url: string
          solution: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          disease_name: string
          id?: string
          image_url: string
          solution?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          disease_name?: string
          id?: string
          image_url?: string
          solution?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crop_plans: {
        Row: {
          created_at: string
          crop: string
          estimated_cost: number | null
          expected_profit_max: number | null
          expected_profit_min: number | null
          id: string
          land_area: number
          land_unit: string
          soil_type: string
          user_id: string
          water_availability: string
        }
        Insert: {
          created_at?: string
          crop: string
          estimated_cost?: number | null
          expected_profit_max?: number | null
          expected_profit_min?: number | null
          id?: string
          land_area: number
          land_unit?: string
          soil_type: string
          user_id: string
          water_availability: string
        }
        Update: {
          created_at?: string
          crop?: string
          estimated_cost?: number | null
          expected_profit_max?: number | null
          expected_profit_min?: number | null
          id?: string
          land_area?: number
          land_unit?: string
          soil_type?: string
          user_id?: string
          water_availability?: string
        }
        Relationships: []
      }
      fertilizer_calculator: {
        Row: {
          area_unit: string
          created_at: string
          crop_name: string
          id: string
          nitrogen: number | null
          notes: string | null
          phosphorus: number | null
          potassium: number | null
        }
        Insert: {
          area_unit?: string
          created_at?: string
          crop_name: string
          id?: string
          nitrogen?: number | null
          notes?: string | null
          phosphorus?: number | null
          potassium?: number | null
        }
        Update: {
          area_unit?: string
          created_at?: string
          crop_name?: string
          id?: string
          nitrogen?: number | null
          notes?: string | null
          phosphorus?: number | null
          potassium?: number | null
        }
        Relationships: []
      }
      government_schemes: {
        Row: {
          benefits: string | null
          category: string | null
          created_at: string
          deadline: string | null
          description: string
          eligibility: string | null
          how_to_apply: string | null
          id: string
          title: string
        }
        Insert: {
          benefits?: string | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          eligibility?: string | null
          how_to_apply?: string | null
          id?: string
          title: string
        }
        Update: {
          benefits?: string | null
          category?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          eligibility?: string | null
          how_to_apply?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      mandi_prices: {
        Row: {
          crop_name: string
          district: string | null
          id: string
          market_name: string
          max_price: number | null
          min_price: number | null
          modal_price: number | null
          state: string | null
          updated_on: string
        }
        Insert: {
          crop_name: string
          district?: string | null
          id?: string
          market_name: string
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          state?: string | null
          updated_on?: string
        }
        Update: {
          crop_name?: string
          district?: string | null
          id?: string
          market_name?: string
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          state?: string | null
          updated_on?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          category: string | null
          content_english: string
          content_hindi: string | null
          content_marathi: string | null
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean | null
          title_english: string
          title_hindi: string | null
          title_marathi: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          content_english: string
          content_hindi?: string | null
          content_marathi?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          title_english: string
          title_hindi?: string | null
          title_marathi?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          content_english?: string
          content_hindi?: string | null
          content_marathi?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          title_english?: string
          title_hindi?: string | null
          title_marathi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          preferred_language: string | null
          profile_photo: string | null
          state: string | null
          updated_at: string
          village: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone: string
          preferred_language?: string | null
          profile_photo?: string | null
          state?: string | null
          updated_at?: string
          village: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          preferred_language?: string | null
          profile_photo?: string | null
          state?: string | null
          updated_at?: string
          village?: string
        }
        Relationships: []
      }
      saved_schemes: {
        Row: {
          application_number: string | null
          created_at: string
          documents_completed: boolean | null
          id: string
          notes: string | null
          scheme_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_number?: string | null
          created_at?: string
          documents_completed?: boolean | null
          id?: string
          notes?: string | null
          scheme_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_number?: string | null
          created_at?: string
          documents_completed?: boolean | null
          id?: string
          notes?: string | null
          scheme_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_schemes_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "government_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string
          english: string
          hindi: string | null
          id: string
          key: string
          marathi: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          english: string
          hindi?: string | null
          id?: string
          key: string
          marathi?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          english?: string
          hindi?: string | null
          id?: string
          key?: string
          marathi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weather_alerts: {
        Row: {
          alert_message: string | null
          created_at: string
          district: string
          humidity: number | null
          id: string
          rain_chance: number | null
          temperature: number | null
        }
        Insert: {
          alert_message?: string | null
          created_at?: string
          district: string
          humidity?: number | null
          id?: string
          rain_chance?: number | null
          temperature?: number | null
        }
        Update: {
          alert_message?: string | null
          created_at?: string
          district?: string
          humidity?: number | null
          id?: string
          rain_chance?: number | null
          temperature?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
