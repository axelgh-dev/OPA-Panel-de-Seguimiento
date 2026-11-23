export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }
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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          meta: NonNullable<Json>
          project_id: string
        }
        ComputedFields: never
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: NonNullable<Json>
          project_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: NonNullable<Json>
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_log_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_log_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_log_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      change_requests: {
        Row: {
          created_at: string
          description: string
          id: string
          impact_note: string | null
          priority: Database['public']['Enums']['priority_level']
          project_id: string
          requested_by: string
          resolved_at: string | null
          status: Database['public']['Enums']['change_req_status']
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          description?: string
          id?: string
          impact_note?: string | null
          priority?: Database['public']['Enums']['priority_level']
          project_id: string
          requested_by: string
          resolved_at?: string | null
          status?: Database['public']['Enums']['change_req_status']
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          impact_note?: string | null
          priority?: Database['public']['Enums']['priority_level']
          project_id?: string
          requested_by?: string
          resolved_at?: string | null
          status?: Database['public']['Enums']['change_req_status']
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'change_requests_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'change_requests_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'change_requests_requested_by_fkey'
            columns: ['requested_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          parent_id: string | null
          project_id: string
          target_id: string
          target_type: Database['public']['Enums']['comment_target']
        }
        ComputedFields: never
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          project_id: string
          target_id: string
          target_type: Database['public']['Enums']['comment_target']
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          project_id?: string
          target_id?: string
          target_type?: Database['public']['Enums']['comment_target']
        }
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'comments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      deliverable_reviews: {
        Row: {
          comment: string
          created_at: string
          decision: Database['public']['Enums']['review_decision']
          deliverable_id: string
          id: string
          reviewer_id: string
        }
        ComputedFields: never
        Insert: {
          comment?: string
          created_at?: string
          decision: Database['public']['Enums']['review_decision']
          deliverable_id: string
          id?: string
          reviewer_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          decision?: Database['public']['Enums']['review_decision']
          deliverable_id?: string
          id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'deliverable_reviews_deliverable_id_fkey'
            columns: ['deliverable_id']
            isOneToOne: false
            referencedRelation: 'deliverables'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deliverable_reviews_reviewer_id_fkey'
            columns: ['reviewer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      deliverables: {
        Row: {
          created_by: string
          decided_at: string | null
          description: string
          id: string
          link_url: string | null
          milestone_id: string | null
          project_id: string
          status: Database['public']['Enums']['deliverable_status']
          storage_path: string | null
          submitted_at: string | null
          title: string
          version: number
        }
        ComputedFields: never
        Insert: {
          created_by: string
          decided_at?: string | null
          description?: string
          id?: string
          link_url?: string | null
          milestone_id?: string | null
          project_id: string
          status?: Database['public']['Enums']['deliverable_status']
          storage_path?: string | null
          submitted_at?: string | null
          title: string
          version?: number
        }
        Update: {
          created_by?: string
          decided_at?: string | null
          description?: string
          id?: string
          link_url?: string | null
          milestone_id?: string | null
          project_id?: string
          status?: Database['public']['Enums']['deliverable_status']
          storage_path?: string | null
          submitted_at?: string | null
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'deliverables_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deliverables_milestone_id_fkey'
            columns: ['milestone_id']
            isOneToOne: false
            referencedRelation: 'milestones'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deliverables_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deliverables_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      milestones: {
        Row: {
          completed_at: string | null
          description: string
          due_date: string
          id: string
          name: string
          position: number
          project_id: string
          start_date: string
          status: Database['public']['Enums']['milestone_status']
          weight: number
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          description?: string
          due_date: string
          id?: string
          name: string
          position?: number
          project_id: string
          start_date: string
          status?: Database['public']['Enums']['milestone_status']
          weight?: number
        }
        Update: {
          completed_at?: string | null
          description?: string
          due_date?: string
          id?: string
          name?: string
          position?: number
          project_id?: string
          start_date?: string
          status?: Database['public']['Enums']['milestone_status']
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: 'milestones_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'milestones_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          job_title: string
          notify_prefs: NonNullable<Json>
          role: Database['public']['Enums']['user_role']
        }
        ComputedFields: never
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          is_active?: boolean
          job_title?: string
          notify_prefs?: NonNullable<Json>
          role?: Database['public']['Enums']['user_role']
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string
          notify_prefs?: NonNullable<Json>
          role?: Database['public']['Enums']['user_role']
        }
        Relationships: []
      }
      project_members: {
        Row: {
          project_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          project_id: string
          user_id: string
        }
        Update: {
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string
          body_md: string
          created_at: string
          id: string
          project_id: string
          published_at: string
          title: string
          type: Database['public']['Enums']['update_type']
        }
        ComputedFields: never
        Insert: {
          author_id: string
          body_md?: string
          created_at?: string
          id?: string
          project_id: string
          published_at?: string
          title: string
          type?: Database['public']['Enums']['update_type']
        }
        Update: {
          author_id?: string
          body_md?: string
          created_at?: string
          id?: string
          project_id?: string
          published_at?: string
          title?: string
          type?: Database['public']['Enums']['update_type']
        }
        Relationships: [
          {
            foreignKeyName: 'project_updates_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_updates_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_updates_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          description_md: string
          health: Database['public']['Enums']['project_health']
          id: string
          is_published: boolean
          name: string
          priority: Database['public']['Enums']['priority_level']
          progress_override: number | null
          slug: string
          start_date: string
          status: Database['public']['Enums']['project_status']
          summary: string
          target_date: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          archived_at?: string | null
          created_at?: string
          description_md?: string
          health?: Database['public']['Enums']['project_health']
          id?: string
          is_published?: boolean
          name: string
          priority?: Database['public']['Enums']['priority_level']
          progress_override?: number | null
          slug: string
          start_date?: string
          status?: Database['public']['Enums']['project_status']
          summary?: string
          target_date: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description_md?: string
          health?: Database['public']['Enums']['project_health']
          id?: string
          is_published?: boolean
          name?: string
          priority?: Database['public']['Enums']['priority_level']
          progress_override?: number | null
          slug?: string
          start_date?: string
          status?: Database['public']['Enums']['project_status']
          summary?: string
          target_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      read_receipts: {
        Row: {
          read_at: string
          target_id: string
          target_type: Database['public']['Enums']['comment_target']
          user_id: string
        }
        ComputedFields: never
        Insert: {
          read_at?: string
          target_id: string
          target_type: Database['public']['Enums']['comment_target']
          user_id: string
        }
        Update: {
          read_at?: string
          target_id?: string
          target_type?: Database['public']['Enums']['comment_target']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'read_receipts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          due_date: string | null
          id: string
          is_internal: boolean
          milestone_id: string | null
          position: number
          project_id: string
          status: Database['public']['Enums']['task_status']
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          due_date?: string | null
          id?: string
          is_internal?: boolean
          milestone_id?: string | null
          position?: number
          project_id: string
          status?: Database['public']['Enums']['task_status']
          title: string
          updated_at?: string
        }
        Update: {
          due_date?: string | null
          id?: string
          is_internal?: boolean
          milestone_id?: string | null
          position?: number
          project_id?: string
          status?: Database['public']['Enums']['task_status']
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_milestone_id_fkey'
            columns: ['milestone_id']
            isOneToOne: false
            referencedRelation: 'milestones'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'project_overview'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      project_overview: {
        Row: {
          archived_at: string | null
          created_at: string
          description_md: string
          health: Database['public']['Enums']['project_health']
          id: string
          is_published: boolean
          last_activity_at: string | null
          name: string
          open_change_requests: number | null
          pending_deliverables: number | null
          priority: Database['public']['Enums']['priority_level']
          progress: number | null
          progress_override: number | null
          slug: string
          start_date: string
          status: Database['public']['Enums']['project_status']
          summary: string
          target_date: string
          unread_comments: number | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          description_md?: string | null
          health?: Database['public']['Enums']['project_health'] | null
          id?: string | null
          is_published?: boolean | null
          last_activity_at?: never
          name?: string | null
          open_change_requests?: never
          pending_deliverables?: never
          priority?: Database['public']['Enums']['priority_level'] | null
          progress?: never
          progress_override?: number | null
          slug?: string | null
          start_date?: string | null
          status?: Database['public']['Enums']['project_status'] | null
          summary?: string | null
          target_date?: string | null
          unread_comments?: never
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          description_md?: string | null
          health?: Database['public']['Enums']['project_health'] | null
          id?: string | null
          is_published?: boolean | null
          last_activity_at?: never
          name?: string | null
          open_change_requests?: never
          pending_deliverables?: never
          priority?: Database['public']['Enums']['priority_level'] | null
          progress?: never
          progress_override?: number | null
          slug?: string | null
          start_date?: string | null
          status?: Database['public']['Enums']['project_status'] | null
          summary?: string | null
          target_date?: string | null
          unread_comments?: never
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      app_role: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Enums']['user_role']
      }
      can_see_project: { Args: { p: string }; Returns: boolean }
      comment_has_replies: { Args: { c: string }; Returns: boolean }
      is_dev: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_opa: { Args: Record<PropertyKey, never>; Returns: boolean }
      log_activity: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_label: string
          p_meta?: Json
          p_project: string
        }
        Returns: undefined
      }
      review_deliverable: {
        Args: {
          p_comment?: string
          p_decision: Database['public']['Enums']['review_decision']
          p_deliverable_id: string
        }
        Returns: undefined
      }
      set_change_request_status: {
        Args: {
          p_id: string
          p_impact_note?: string
          p_status: Database['public']['Enums']['change_req_status']
          p_update_note?: boolean
        }
        Returns: undefined
      }
      set_project_priority: {
        Args: { p_priority: Database['public']['Enums']['priority_level']; p_project_id: string }
        Returns: undefined
      }
      submit_deliverable: { Args: { p_deliverable_id: string }; Returns: undefined }
    }
    Enums: {
      change_req_status:
        'nueva' | 'en_analisis' | 'aceptada' | 'rechazada' | 'en_progreso' | 'completada'
      comment_target: 'project' | 'deliverable' | 'update' | 'change_request'
      deliverable_status:
        'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'cambios_solicitados'
      milestone_status: 'pendiente' | 'en_curso' | 'completado' | 'retrasado'
      priority_level: 'alta' | 'media' | 'baja'
      project_health: 'en_tiempo' | 'en_riesgo' | 'retrasado'
      project_status:
        'planeacion' | 'en_progreso' | 'en_pausa' | 'en_revision' | 'completado' | 'cancelado'
      review_decision: 'aprobado' | 'rechazado' | 'cambios_solicitados'
      task_status: 'pendiente' | 'en_progreso' | 'bloqueada' | 'hecha'
      update_type: 'avance' | 'entrega' | 'bloqueo' | 'nota' | 'reunion'
      user_role: 'dev' | 'opa'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      change_req_status: [
        'nueva',
        'en_analisis',
        'aceptada',
        'rechazada',
        'en_progreso',
        'completada',
      ],
      comment_target: ['project', 'deliverable', 'update', 'change_request'],
      deliverable_status: [
        'borrador',
        'en_revision',
        'aprobado',
        'rechazado',
        'cambios_solicitados',
      ],
      milestone_status: ['pendiente', 'en_curso', 'completado', 'retrasado'],
      priority_level: ['alta', 'media', 'baja'],
      project_health: ['en_tiempo', 'en_riesgo', 'retrasado'],
      project_status: [
        'planeacion',
        'en_progreso',
        'en_pausa',
        'en_revision',
        'completado',
        'cancelado',
      ],
      review_decision: ['aprobado', 'rechazado', 'cambios_solicitados'],
      task_status: ['pendiente', 'en_progreso', 'bloqueada', 'hecha'],
      update_type: ['avance', 'entrega', 'bloqueo', 'nota', 'reunion'],
      user_role: ['dev', 'opa'],
    },
  },
} as const
