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
      albums: {
        Row: {
          artist_name: string
          composition_copyright: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          has_cover_versions: boolean | null
          id: string
          is_approved: boolean | null
          is_compilation: boolean | null
          is_explicit: boolean | null
          language: string | null
          pre_order_date: string | null
          primary_genre: string | null
          record_label: string | null
          recording_copyright: string | null
          release_date: string | null
          release_type: string | null
          sales_start_date: string | null
          secondary_genre: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
          version: string | null
        }
        Insert: {
          artist_name: string
          composition_copyright?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          has_cover_versions?: boolean | null
          id?: string
          is_approved?: boolean | null
          is_compilation?: boolean | null
          is_explicit?: boolean | null
          language?: string | null
          pre_order_date?: string | null
          primary_genre?: string | null
          record_label?: string | null
          recording_copyright?: string | null
          release_date?: string | null
          release_type?: string | null
          sales_start_date?: string | null
          secondary_genre?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: string | null
        }
        Update: {
          artist_name?: string
          composition_copyright?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          has_cover_versions?: boolean | null
          id?: string
          is_approved?: boolean | null
          is_compilation?: boolean | null
          is_explicit?: boolean | null
          language?: string | null
          pre_order_date?: string | null
          primary_genre?: string | null
          record_label?: string | null
          recording_copyright?: string | null
          release_date?: string | null
          release_type?: string | null
          sales_start_date?: string | null
          secondary_genre?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      liked_tracks: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      play_history: {
        Row: {
          id: string
          played_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          id?: string
          played_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          id?: string
          played_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          position: number | null
          track_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          position?: number | null
          track_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          position?: number | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          gradient: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gradient?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gradient?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
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
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          artist_name: string | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          cover_photo_url: string | null
          created_at: string
          display_name: string | null
          followers_count: number | null
          id: string
          instagram: string | null
          is_artist: boolean | null
          short_reel_url: string | null
          subscription_tier: string | null
          tiktok: string | null
          total_plays: number | null
          updated_at: string
          user_id: string
          website: string | null
          youtube: string | null
        }
        Insert: {
          artist_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string
          display_name?: string | null
          followers_count?: number | null
          id?: string
          instagram?: string | null
          is_artist?: boolean | null
          short_reel_url?: string | null
          subscription_tier?: string | null
          tiktok?: string | null
          total_plays?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
          youtube?: string | null
        }
        Update: {
          artist_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string
          display_name?: string | null
          followers_count?: number | null
          id?: string
          instagram?: string | null
          is_artist?: boolean | null
          short_reel_url?: string | null
          subscription_tier?: string | null
          tiktok?: string | null
          total_plays?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      songs: {
        Row: {
          album: string | null
          artist: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          genre: string | null
          id: number
          title: string
          uploaded_at: string | null
        }
        Insert: {
          album?: string | null
          artist?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          genre?: string | null
          id?: number
          title: string
          uploaded_at?: string | null
        }
        Update: {
          album?: string | null
          artist?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          genre?: string | null
          id?: number
          title?: string
          uploaded_at?: string | null
        }
        Relationships: []
      }
      tracks: {
        Row: {
          album: string | null
          album_id: string | null
          artist_name: string
          audio_url: string
          bpm: number | null
          cover_url: string | null
          created_at: string
          duration: number | null
          genre: string | null
          id: string
          is_approved: boolean | null
          is_explicit: boolean | null
          isrc_code: string | null
          key: string | null
          like_count: number | null
          mood_tags: string[] | null
          play_count: number | null
          secondary_genre: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
          version: string | null
          video_reel_url: string | null
        }
        Insert: {
          album?: string | null
          album_id?: string | null
          artist_name: string
          audio_url: string
          bpm?: number | null
          cover_url?: string | null
          created_at?: string
          duration?: number | null
          genre?: string | null
          id?: string
          is_approved?: boolean | null
          is_explicit?: boolean | null
          isrc_code?: string | null
          key?: string | null
          like_count?: number | null
          mood_tags?: string[] | null
          play_count?: number | null
          secondary_genre?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: string | null
          video_reel_url?: string | null
        }
        Update: {
          album?: string | null
          album_id?: string | null
          artist_name?: string
          audio_url?: string
          bpm?: number | null
          cover_url?: string | null
          created_at?: string
          duration?: number | null
          genre?: string | null
          id?: string
          is_approved?: boolean | null
          is_explicit?: boolean | null
          isrc_code?: string | null
          key?: string | null
          like_count?: number | null
          mood_tags?: string[] | null
          play_count?: number | null
          secondary_genre?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: string | null
          video_reel_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_songs: {
        Row: {
          album: string | null
          artist: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          genre: string | null
          id: number
          title: string
          uploaded_at: string | null
        }
        Insert: {
          album?: string | null
          artist?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          genre?: string | null
          id?: number
          title: string
          uploaded_at?: string | null
        }
        Update: {
          album?: string | null
          artist?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          genre?: string | null
          id?: number
          title?: string
          uploaded_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: number
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          password_hash?: string
          username?: string
        }
        Relationships: []
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
