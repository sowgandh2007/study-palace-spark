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
      ai_battle_scores: {
        Row: {
          accuracy: number
          battle_id: string
          created_at: string
          duration_sec: number
          id: string
          score: number
          user_id: string
        }
        Insert: {
          accuracy?: number
          battle_id: string
          created_at?: string
          duration_sec?: number
          id?: string
          score?: number
          user_id: string
        }
        Update: {
          accuracy?: number
          battle_id?: string
          created_at?: string
          duration_sec?: number
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_battle_scores_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "ai_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_battles: {
        Row: {
          created_at: string
          difficulty: string
          host_id: string
          id: string
          questions: Json
          status: string
          topic: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          host_id: string
          id?: string
          questions: Json
          status?: string
          topic: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          host_id?: string
          id?: string
          questions?: Json
          status?: string
          topic?: string
        }
        Relationships: []
      }
      ai_cache: {
        Row: {
          cache_key: string
          created_at: string
          id: string
          payload: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          id?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      ai_career_roadmaps: {
        Row: {
          created_at: string
          goal: string
          id: string
          milestones: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          goal: string
          id?: string
          milestones: Json
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string
          id?: string
          milestones?: Json
          user_id?: string
        }
        Relationships: []
      }
      ai_chats: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_flashcards: {
        Row: {
          back: string
          created_at: string
          due_date: string
          ease: number
          front: string
          id: string
          interval_days: number
          last_score: number | null
          topic: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          due_date?: string
          ease?: number
          front: string
          id?: string
          interval_days?: number
          last_score?: number | null
          topic: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          due_date?: string
          ease?: number
          front?: string
          id?: string
          interval_days?: number
          last_score?: number | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ai_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_quizzes: {
        Row: {
          answers: Json | null
          battle_id: string | null
          created_at: string
          difficulty: string
          duration_sec: number | null
          id: string
          questions: Json
          score: number | null
          topic: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          battle_id?: string | null
          created_at?: string
          difficulty?: string
          duration_sec?: number | null
          id?: string
          questions: Json
          score?: number | null
          topic: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          battle_id?: string | null
          created_at?: string
          difficulty?: string
          duration_sec?: number | null
          id?: string
          questions?: Json
          score?: number | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_roadmap_tasks: {
        Row: {
          completed: boolean
          created_at: string
          day: string
          id: string
          kind: string
          minutes: number
          roadmap_id: string
          subject: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          day: string
          id?: string
          kind: string
          minutes?: number
          roadmap_id: string
          subject?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          day?: string
          id?: string
          kind?: string
          minutes?: number
          roadmap_id?: string
          subject?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_roadmap_tasks_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "ai_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_roadmaps: {
        Row: {
          created_at: string
          exam: string
          hours_per_day: number
          id: string
          plan: Json
          strong_topics: string[]
          subjects: string[]
          target_date: string | null
          updated_at: string
          user_id: string
          weak_topics: string[]
        }
        Insert: {
          created_at?: string
          exam: string
          hours_per_day?: number
          id?: string
          plan?: Json
          strong_topics?: string[]
          subjects?: string[]
          target_date?: string | null
          updated_at?: string
          user_id: string
          weak_topics?: string[]
        }
        Update: {
          created_at?: string
          exam?: string
          hours_per_day?: number
          id?: string
          plan?: Json
          strong_topics?: string[]
          subjects?: string[]
          target_date?: string | null
          updated_at?: string
          user_id?: string
          weak_topics?: string[]
        }
        Relationships: []
      }
      badges: {
        Row: {
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          description: string
          icon: string
          id: string
          name: string
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: Database["public"]["Enums"]["friend_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: Database["public"]["Enums"]["friend_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: Database["public"]["Enums"]["friend_status"]
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          pinned: boolean
          room_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          pinned?: boolean
          room_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          completed: boolean
          day: string
          id: string
          kind: Database["public"]["Enums"]["mission_kind"]
          progress: number
          reward_coins: number
          reward_xp: number
          target: number
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          day?: string
          id?: string
          kind: Database["public"]["Enums"]["mission_kind"]
          progress?: number
          reward_coins?: number
          reward_xp?: number
          target: number
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          day?: string
          id?: string
          kind?: Database["public"]["Enums"]["mission_kind"]
          progress?: number
          reward_coins?: number
          reward_xp?: number
          target?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notif_kind"]
          payload: Json | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notif_kind"]
          payload?: Json | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notif_kind"]
          payload?: Json | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number
          created_at: string
          display_name: string
          focus_score: number
          id: string
          is_guest: boolean
          last_active_day: string | null
          level: number
          streak: number
          title: string
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          focus_score?: number
          id: string
          is_guest?: boolean
          last_active_day?: string | null
          level?: number
          streak?: number
          title?: string
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          coins?: number
          created_at?: string
          display_name?: string
          focus_score?: number
          id?: string
          is_guest?: boolean
          last_active_day?: string | null
          level?: number
          streak?: number
          title?: string
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["resource_kind"]
          room_id: string
          storage_path: string
          subject: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["resource_kind"]
          room_id: string
          storage_path: string
          subject?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["resource_kind"]
          room_id?: string
          storage_path?: string
          subject?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          focus_score: number
          id: string
          joined_at: string
          progress_pct: number
          role: Database["public"]["Enums"]["room_role"]
          room_id: string
          status: Database["public"]["Enums"]["member_status"]
          subject: string | null
          timer_seconds: number
          topic: string | null
          updated_at: string
          user_id: string
          xp_delta: number
        }
        Insert: {
          focus_score?: number
          id?: string
          joined_at?: string
          progress_pct?: number
          role?: Database["public"]["Enums"]["room_role"]
          room_id: string
          status?: Database["public"]["Enums"]["member_status"]
          subject?: string | null
          timer_seconds?: number
          topic?: string | null
          updated_at?: string
          user_id: string
          xp_delta?: number
        }
        Update: {
          focus_score?: number
          id?: string
          joined_at?: string
          progress_pct?: number
          role?: Database["public"]["Enums"]["room_role"]
          room_id?: string
          status?: Database["public"]["Enums"]["member_status"]
          subject?: string | null
          timer_seconds?: number
          topic?: string | null
          updated_at?: string
          user_id?: string
          xp_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          id: string
          is_public: boolean
          name: string
          owner_id: string
          subject: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_public?: boolean
          name: string
          owner_id: string
          subject?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
          owner_id?: string
          subject?: string | null
        }
        Relationships: []
      }
      skill_nodes: {
        Row: {
          id: string
          node_key: string
          subject: string
          unlocked: boolean
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          node_key: string
          subject: string
          unlocked?: boolean
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          node_key?: string
          subject?: string
          unlocked?: boolean
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          day: string
          id: string
          minutes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          minutes?: number
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      subject_mastery: {
        Row: {
          accuracy: number
          chapters_done: number
          difficulty_bonus: number
          id: string
          mastery: number
          quizzes_count: number
          revision_score: number
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number
          chapters_done?: number
          difficulty_bonus?: number
          id?: string
          mastery?: number
          quizzes_count?: number
          revision_score?: number
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          chapters_done?: number
          difficulty_bonus?: number
          id?: string
          mastery?: number
          quizzes_count?: number
          revision_score?: number
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_mastery: {
        Row: {
          attempts: number
          id: string
          mastery: number
          subject: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          id?: string
          mastery?: number
          subject: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          id?: string
          mastery?: number
          subject?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          kind: string
          meta: Json
          progress: number
          reward_badge_id: string | null
          reward_coins: number
          reward_xp: number
          target: number
          title: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          meta?: Json
          progress?: number
          reward_badge_id?: string | null
          reward_coins?: number
          reward_xp?: number
          target?: number
          title: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          meta?: Json
          progress?: number
          reward_badge_id?: string | null
          reward_coins?: number
          reward_xp?: number
          target?: number
          title?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      whiteboard_strokes: {
        Row: {
          created_at: string
          id: string
          path: Json
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: Json
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: Json
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whiteboard_strokes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
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
      is_room_member: {
        Args: { _room: string; _user: string }
        Returns: boolean
      }
      is_room_owner: {
        Args: { _room: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
      friend_status: "pending" | "accepted" | "blocked"
      member_status: "studying" | "quiz" | "break" | "offline"
      mission_kind: "study_time" | "chapters" | "questions" | "revise"
      notif_kind:
        | "room_invite"
        | "daily_reminder"
        | "mission_complete"
        | "leaderboard"
        | "friend_activity"
      resource_kind: "pdf" | "note" | "image" | "mindmap" | "paper"
      room_role: "owner" | "member"
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
      app_role: ["user", "admin"],
      friend_status: ["pending", "accepted", "blocked"],
      member_status: ["studying", "quiz", "break", "offline"],
      mission_kind: ["study_time", "chapters", "questions", "revise"],
      notif_kind: [
        "room_invite",
        "daily_reminder",
        "mission_complete",
        "leaderboard",
        "friend_activity",
      ],
      resource_kind: ["pdf", "note", "image", "mindmap", "paper"],
      room_role: ["owner", "member"],
    },
  },
} as const
