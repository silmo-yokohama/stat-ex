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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      box_scores: {
        Row: {
          ast: number
          blk: number
          created_at: string
          dr_reb: number
          eff: number
          fg_pct: number | null
          fga: number
          fgm: number
          fouls: number
          ft_pct: number | null
          fta: number
          ftm: number
          game_id: string
          id: string
          is_starter: boolean
          minutes: string | null
          or_reb: number
          player_id: string
          plus_minus: number
          pts: number
          reb: number
          stl: number
          team_side: string
          tov: number
          tp_pct: number | null
          tpa: number
          tpm: number
          updated_at: string
        }
        Insert: {
          ast?: number
          blk?: number
          created_at?: string
          dr_reb?: number
          eff?: number
          fg_pct?: number | null
          fga?: number
          fgm?: number
          fouls?: number
          ft_pct?: number | null
          fta?: number
          ftm?: number
          game_id: string
          id?: string
          is_starter?: boolean
          minutes?: string | null
          or_reb?: number
          player_id: string
          plus_minus?: number
          pts?: number
          reb?: number
          stl?: number
          team_side: string
          tov?: number
          tp_pct?: number | null
          tpa?: number
          tpm?: number
          updated_at?: string
        }
        Update: {
          ast?: number
          blk?: number
          created_at?: string
          dr_reb?: number
          eff?: number
          fg_pct?: number | null
          fga?: number
          fgm?: number
          fouls?: number
          ft_pct?: number | null
          fta?: number
          ftm?: number
          game_id?: string
          id?: string
          is_starter?: boolean
          minutes?: string | null
          or_reb?: number
          player_id?: string
          plus_minus?: number
          pts?: number
          reb?: number
          stl?: number
          team_side?: string
          tov?: number
          tp_pct?: number | null
          tpa?: number
          tpm?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "box_scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "box_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_comments: {
        Row: {
          content: string
          created_at: string
          game_id: string
          generated_at: string
          id: string
          model: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          game_id: string
          generated_at?: string
          id?: string
          model?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          game_id?: string
          generated_at?: string
          id?: string
          model?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_comments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          attendance: number | null
          created_at: string
          game_date: string
          game_time: string | null
          home_away: string
          id: string
          opponent_team_id: string
          q1_away: number | null
          q1_home: number | null
          q2_away: number | null
          q2_home: number | null
          q3_away: number | null
          q3_home: number | null
          q4_away: number | null
          q4_home: number | null
          referee: string | null
          schedule_key: string
          score_away: number | null
          score_home: number | null
          season_id: string
          sportsnavi_game_id: string | null
          status: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          attendance?: number | null
          created_at?: string
          game_date: string
          game_time?: string | null
          home_away: string
          id?: string
          opponent_team_id: string
          q1_away?: number | null
          q1_home?: number | null
          q2_away?: number | null
          q2_home?: number | null
          q3_away?: number | null
          q3_home?: number | null
          q4_away?: number | null
          q4_home?: number | null
          referee?: string | null
          schedule_key: string
          score_away?: number | null
          score_home?: number | null
          season_id: string
          sportsnavi_game_id?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          attendance?: number | null
          created_at?: string
          game_date?: string
          game_time?: string | null
          home_away?: string
          id?: string
          opponent_team_id?: string
          q1_away?: number | null
          q1_home?: number | null
          q2_away?: number | null
          q2_home?: number | null
          q3_away?: number | null
          q3_home?: number | null
          q4_away?: number | null
          q4_home?: number | null
          referee?: string | null
          schedule_key?: string
          score_away?: number | null
          score_home?: number | null
          season_id?: string
          sportsnavi_game_id?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      h2h_records: {
        Row: {
          avg_points_against: number | null
          avg_points_for: number | null
          created_at: string
          id: string
          losses: number
          opponent_team_id: string
          season_id: string
          updated_at: string
          wins: number
        }
        Insert: {
          avg_points_against?: number | null
          avg_points_for?: number | null
          created_at?: string
          id?: string
          losses?: number
          opponent_team_id: string
          season_id: string
          updated_at?: string
          wins?: number
        }
        Update: {
          avg_points_against?: number | null
          avg_points_for?: number | null
          created_at?: string
          id?: string
          losses?: number
          opponent_team_id?: string
          season_id?: string
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "h2h_records_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "h2h_records_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      injuries: {
        Row: {
          created_at: string
          id: string
          player_id: string
          reason: string
          registered_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          reason: string
          registered_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          reason?: string
          registered_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "injuries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      mascot: {
        Row: {
          created_at: string
          id: string
          images_json: Json | null
          name: string
          profile_json: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          images_json?: Json | null
          name: string
          profile_json?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          images_json?: Json | null
          name?: string
          profile_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          created_at: string
          id: string
          published_at: string
          source: string
          source_name: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          published_at: string
          source: string
          source_name?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          published_at?: string
          source?: string
          source_name?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      player_seasons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          joined_date: string | null
          left_date: string | null
          player_id: string
          season_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_date?: string | null
          left_date?: string | null
          player_id: string
          season_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_date?: string | null
          left_date?: string | null
          player_id?: string
          season_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_seasons_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_seasons_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          birthdate: string | null
          birthplace: string | null
          bleague_player_id: string
          created_at: string
          height: number | null
          id: string
          image_url: string | null
          name: string
          name_en: string | null
          number: number | null
          position: string | null
          sportsnavi_player_id: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          birthdate?: string | null
          birthplace?: string | null
          bleague_player_id: string
          created_at?: string
          height?: number | null
          id?: string
          image_url?: string | null
          name: string
          name_en?: string | null
          number?: number | null
          position?: string | null
          sportsnavi_player_id?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          birthdate?: string | null
          birthplace?: string | null
          bleague_player_id?: string
          created_at?: string
          height?: number | null
          id?: string
          image_url?: string | null
          name?: string
          name_en?: string | null
          number?: number | null
          position?: string | null
          sportsnavi_player_id?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      standings: {
        Row: {
          created_at: string
          games_behind: number | null
          id: string
          last5: string | null
          losses: number
          point_diff: number | null
          points_against: number | null
          points_for: number | null
          rank: number
          season_id: string
          streak: string | null
          team_id: string
          updated_at: string
          win_pct: number | null
          wins: number
        }
        Insert: {
          created_at?: string
          games_behind?: number | null
          id?: string
          last5?: string | null
          losses?: number
          point_diff?: number | null
          points_against?: number | null
          points_for?: number | null
          rank: number
          season_id: string
          streak?: string | null
          team_id: string
          updated_at?: string
          win_pct?: number | null
          wins?: number
        }
        Update: {
          created_at?: string
          games_behind?: number | null
          id?: string
          last5?: string | null
          losses?: number
          point_diff?: number | null
          points_against?: number | null
          points_for?: number | null
          rank?: number
          season_id?: string
          streak?: string | null
          team_id?: string
          updated_at?: string
          win_pct?: number | null
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_stats: {
        Row: {
          avg_points_against: number | null
          avg_points_for: number | null
          away_losses: number
          away_wins: number
          created_at: string
          home_losses: number
          home_wins: number
          id: string
          losses: number
          season_id: string
          updated_at: string
          win_pct: number | null
          wins: number
        }
        Insert: {
          avg_points_against?: number | null
          avg_points_for?: number | null
          away_losses?: number
          away_wins?: number
          created_at?: string
          home_losses?: number
          home_wins?: number
          id?: string
          losses?: number
          season_id: string
          updated_at?: string
          win_pct?: number | null
          wins?: number
        }
        Update: {
          avg_points_against?: number | null
          avg_points_for?: number | null
          away_losses?: number
          away_wins?: number
          created_at?: string
          home_losses?: number
          home_wins?: number
          id?: string
          losses?: number
          season_id?: string
          updated_at?: string
          win_pct?: number | null
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: true
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          arena: string | null
          bleague_team_id: number
          city: string | null
          created_at: string
          id: string
          name: string
          short_name: string
          updated_at: string
        }
        Insert: {
          arena?: string | null
          bleague_team_id: number
          city?: string | null
          created_at?: string
          id?: string
          name: string
          short_name: string
          updated_at?: string
        }
        Update: {
          arena?: string | null
          bleague_team_id?: number
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          short_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          game_id: string | null
          id: string
          published_at: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_id: string
        }
        Insert: {
          created_at?: string
          game_id?: string | null
          id?: string
          published_at: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_id: string
        }
        Update: {
          created_at?: string
          game_id?: string | null
          id?: string
          published_at?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
