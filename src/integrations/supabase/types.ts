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
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          criteria_type: string
          criteria_value?: number
          description: string
          icon?: string
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          attachments: Json | null
          chat_id: string
          content: string
          created_at: string
          id: string
          mode: string | null
          role: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          chat_id: string
          content: string
          created_at?: string
          id?: string
          mode?: string | null
          role: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          mode?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ai_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chats: {
        Row: {
          created_at: string
          favorite: boolean
          id: string
          mode: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite?: boolean
          id?: string
          mode?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite?: boolean
          id?: string
          mode?: string
          pinned?: boolean
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
          deck_name: string
          difficulty: string | null
          front: string
          id: string
          last_reviewed_at: string | null
          review_count: number
          source: string | null
          source_id: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_name?: string
          difficulty?: string | null
          front: string
          id?: string
          last_reviewed_at?: string | null
          review_count?: number
          source?: string | null
          source_id?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_name?: string
          difficulty?: string | null
          front?: string
          id?: string
          last_reviewed_at?: string | null
          review_count?: number
          source?: string | null
          source_id?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          created_at: string
          goal_id: string | null
          id: string
          input: Json
          kind: string
          output: Json
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id?: string | null
          id?: string
          input?: Json
          kind: string
          output?: Json
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string | null
          id?: string
          input?: Json
          kind?: string
          output?: Json
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_quizzes: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string
          difficulty: string
          id: string
          question_types: string[]
          questions: Json
          score: number | null
          topic: string
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          question_types?: string[]
          questions?: Json
          score?: number | null
          topic: string
          total_questions?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          id?: string
          question_types?: string[]
          questions?: Json
          score?: number | null
          topic?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          post_type: string
          title: string
          topic: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_type: string
          title: string
          topic: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_type?: string
          title?: string
          topic?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          confusing_concepts: string | null
          created_at: string
          distractions_count: number
          exercises: string | null
          explanation: string
          focus_score: number | null
          focus_seconds: number
          goals_completed: number
          id: string
          notes: string | null
          report_date: string
          sessions_count: number
          studied: string
          topics: string[]
          understood: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          confusing_concepts?: string | null
          created_at?: string
          distractions_count?: number
          exercises?: string | null
          explanation: string
          focus_score?: number | null
          focus_seconds?: number
          goals_completed?: number
          id?: string
          notes?: string | null
          report_date?: string
          sessions_count?: number
          studied: string
          topics?: string[]
          understood: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          confusing_concepts?: string | null
          created_at?: string
          distractions_count?: number
          exercises?: string | null
          explanation?: string
          focus_score?: number | null
          focus_seconds?: number
          goals_completed?: number
          id?: string
          notes?: string | null
          report_date?: string
          sessions_count?: number
          studied?: string
          topics?: string[]
          understood?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      focus_integrity_scores: {
        Row: {
          calculated_at: string
          completion_rate: number
          consistency_score: number
          id: string
          interruption_score: number
          proof_quality_score: number
          score: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          completion_rate?: number
          consistency_score?: number
          id?: string
          interruption_score?: number
          proof_quality_score?: number
          score?: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          completion_rate?: number
          consistency_score?: number
          id?: string
          interruption_score?: number
          proof_quality_score?: number
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      goal_resource_suggestions: {
        Row: {
          effective_level: string | null
          generated_at: string
          goal_id: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          effective_level?: string | null
          generated_at?: string
          goal_id: string
          id?: string
          payload: Json
          user_id: string
        }
        Update: {
          effective_level?: string | null
          generated_at?: string
          goal_id?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_resource_suggestions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      group_challenges: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          group_id: string
          id: string
          start_date: string
          target_metric: string | null
          target_value: number | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          group_id: string
          id?: string
          start_date?: string
          target_metric?: string | null
          target_value?: number | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          group_id?: string
          id?: string
          start_date?: string
          target_metric?: string | null
          target_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_challenges_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_goals: {
        Row: {
          concepts: Json | null
          created_at: string
          custom_hours: number | null
          description: string
          duration_unit: string | null
          duration_value: number | null
          goal_type: string
          id: string
          is_active: boolean
          mastery_level: string
          resources: Json | null
          time_availability: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concepts?: Json | null
          created_at?: string
          custom_hours?: number | null
          description: string
          duration_unit?: string | null
          duration_value?: number | null
          goal_type: string
          id?: string
          is_active?: boolean
          mastery_level: string
          resources?: Json | null
          time_availability: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concepts?: Json | null
          created_at?: string
          custom_hours?: number | null
          description?: string
          duration_unit?: string | null
          duration_value?: number | null
          goal_type?: string
          id?: string
          is_active?: boolean
          mastery_level?: string
          resources?: Json | null
          time_availability?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_activity_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          detail: string | null
          entity_id: string | null
          entity_type: string
          id: string
          mentee_id: string
          mentee_read_at: string | null
          mentor_id: string
          mentor_read_at: string | null
          title: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          mentee_id: string
          mentee_read_at?: string | null
          mentor_id: string
          mentor_read_at?: string | null
          title: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          mentee_id?: string
          mentee_read_at?: string | null
          mentor_id?: string
          mentor_read_at?: string | null
          title?: string
        }
        Relationships: []
      }
      mentor_comments: {
        Row: {
          content: string
          context_id: string | null
          context_type: string | null
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
        }
        Insert: {
          content: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
        }
        Update: {
          content?: string
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
        }
        Relationships: []
      }
      mentor_links: {
        Row: {
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          status?: string
        }
        Relationships: []
      }
      mentor_resources: {
        Row: {
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
          note: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
          note?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          note?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      mentor_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          mentee_id: string
          mentor_id: string
          status: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          mentee_id: string
          mentor_id: string
          status?: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          mentee_id?: string
          mentor_id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      milestone_approvals: {
        Row: {
          approved_at: string
          concept_id: string
          concept_name: string | null
          goal_id: string
          id: string
          mentee_id: string
          mentor_id: string
          note: string | null
        }
        Insert: {
          approved_at?: string
          concept_id: string
          concept_name?: string | null
          goal_id: string
          id?: string
          mentee_id: string
          mentor_id: string
          note?: string | null
        }
        Update: {
          approved_at?: string
          concept_id?: string
          concept_name?: string | null
          goal_id?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          note?: string | null
        }
        Relationships: []
      }
      portfolio_entries: {
        Row: {
          content: string | null
          created_at: string
          entry_type: string
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          entry_type: string
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_upvotes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_upvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_tutor_enabled: boolean | null
          avatar_url: string | null
          created_at: string
          daily_study_target_minutes: number | null
          email: string | null
          email_verified: boolean
          focus: string | null
          id: string
          interests: Json | null
          is_public: boolean
          last_active_date: string | null
          level: string
          name: string
          onboarding_completed: boolean
          skill_level: string | null
          streak: number
          study_preferences: Json | null
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          ai_tutor_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string
          daily_study_target_minutes?: number | null
          email?: string | null
          email_verified?: boolean
          focus?: string | null
          id?: string
          interests?: Json | null
          is_public?: boolean
          last_active_date?: string | null
          level?: string
          name: string
          onboarding_completed?: boolean
          skill_level?: string | null
          streak?: number
          study_preferences?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          ai_tutor_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string
          daily_study_target_minutes?: number | null
          email?: string | null
          email_verified?: boolean
          focus?: string | null
          id?: string
          interests?: Json | null
          is_public?: boolean
          last_active_date?: string | null
          level?: string
          name?: string
          onboarding_completed?: boolean
          skill_level?: string | null
          streak?: number
          study_preferences?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      saved_resources: {
        Row: {
          concept_ids: string[]
          concept_names: string[]
          created_at: string
          description: string | null
          favorite: boolean
          goal_id: string | null
          id: string
          is_free: boolean
          notes: string | null
          rationale: string | null
          source: string | null
          tags: string[]
          title: string
          type: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          concept_ids?: string[]
          concept_names?: string[]
          created_at?: string
          description?: string | null
          favorite?: boolean
          goal_id?: string | null
          id?: string
          is_free?: boolean
          notes?: string | null
          rationale?: string | null
          source?: string | null
          tags?: string[]
          title: string
          type?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          concept_ids?: string[]
          concept_names?: string[]
          created_at?: string
          description?: string | null
          favorite?: boolean
          goal_id?: string | null
          id?: string
          is_free?: boolean
          notes?: string | null
          rationale?: string | null
          source?: string | null
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_resources_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      session_reflections: {
        Row: {
          ai_summary: Json | null
          challenged: string | null
          created_at: string
          distractions: string | null
          focus_rating: number | null
          id: string
          learned: string | null
          mood: string | null
          revise: string | null
          session_id: string
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: Json | null
          challenged?: string | null
          created_at?: string
          distractions?: string | null
          focus_rating?: number | null
          id?: string
          learned?: string | null
          mood?: string | null
          revise?: string | null
          session_id: string
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: Json | null
          challenged?: string | null
          created_at?: string
          distractions?: string | null
          focus_rating?: number | null
          id?: string
          learned?: string | null
          mood?: string | null
          revise?: string | null
          session_id?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invite_code: string
          name: string
          owner_id: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name: string
          owner_id: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          blocks: Json
          created_at: string
          day_of_week: number
          goal_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          day_of_week: number
          goal_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          day_of_week?: number
          goal_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          block_type: string
          concept_id: string | null
          created_at: string
          duration_seconds: number
          ended_at: string | null
          goal_id: string | null
          id: string
          interruptions: number
          notes: string | null
          started_at: string
          tags: string[]
          target_duration_seconds: number | null
          topic: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          block_type: string
          concept_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          goal_id?: string | null
          id?: string
          interruptions?: number
          notes?: string | null
          started_at?: string
          tags?: string[]
          target_duration_seconds?: number | null
          topic: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          block_type?: string
          concept_id?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          goal_id?: string | null
          id?: string
          interruptions?: number
          notes?: string | null
          started_at?: string
          tags?: string[]
          target_duration_seconds?: number | null
          topic?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "learning_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          seen: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          seen?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          seen?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp_to_user: {
        Args: { p_user_id: string; p_xp: number }
        Returns: undefined
      }
      calculate_focus_integrity: { Args: { p_user_id: string }; Returns: Json }
      can_view_profile: { Args: { _profile_user_id: string }; Returns: boolean }
      decrement_missed_streaks: { Args: never; Returns: undefined }
      evaluate_user_achievements: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      get_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          id: string
          level: string
          name: string
          streak: number
          user_id: string
          xp: number
        }[]
      }
      get_linked_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          level: string
          name: string
          streak: number
          user_id: string
          xp: number
        }[]
      }
      get_mentee_timeline: {
        Args: { _limit?: number; _mentee: string }
        Returns: {
          detail: string
          event_time: string
          event_type: string
          ref_id: string
          title: string
        }[]
      }
      get_mentee_weekly_summary: {
        Args: { _mentee: string }
        Returns: {
          day: string
          focus_minutes: number
          reflections: number
          sessions: number
          xp: number
        }[]
      }
      get_top_contributors: {
        Args: { _limit?: number }
        Returns: {
          avatar_url: string
          name: string
          post_count: number
          reaction_count: number
          user_id: string
        }[]
      }
      get_trending_topics: {
        Args: { _limit?: number }
        Returns: {
          post_count: number
          topic: string
        }[]
      }
      get_visible_profile: {
        Args: { _profile_user_id: string }
        Returns: {
          avatar_url: string
          focus: string
          is_public: boolean
          level: string
          name: string
          streak: number
          user_id: string
          username: string
          xp: number
        }[]
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_owner: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_linked_with: { Args: { _a: string; _b: string }; Returns: boolean }
      is_mentor_of: {
        Args: { _mentee: string; _mentor: string }
        Returns: boolean
      }
      mark_mentor_activity_read: { Args: never; Returns: number }
      search_mentor_candidates: {
        Args: { query: string }
        Returns: {
          name: string
          user_id: string
        }[]
      }
      unlock_achievement: {
        Args: { p_code: string; p_user_id: string }
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
  public: {
    Enums: {},
  },
} as const
