export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string;
          booking_time: string;
          created_at: string;
          customer_name: string;
          customer_phone: string;
          id: string;
          notes: string | null;
          service_id: string | null;
          service_name: string;
          shop_id: string;
          shop_response: string | null;
          status: Database['public']['Enums']['booking_status'];
          updated_at: string;
          user_id: string;
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_year: number | null;
        };
        ComputedFields: never;
        Insert: {
          booking_date: string;
          booking_time: string;
          created_at?: string;
          customer_name: string;
          customer_phone: string;
          id?: string;
          notes?: string | null;
          service_id?: string | null;
          service_name: string;
          shop_id: string;
          shop_response?: string | null;
          status?: Database['public']['Enums']['booking_status'];
          updated_at?: string;
          user_id: string;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_year?: number | null;
        };
        Update: {
          booking_date?: string;
          booking_time?: string;
          created_at?: string;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          notes?: string | null;
          service_id?: string | null;
          service_name?: string;
          shop_id?: string;
          shop_response?: string | null;
          status?: Database['public']['Enums']['booking_status'];
          updated_at?: string;
          user_id?: string;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'shop_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      enquiries: {
        Row: {
          budget: number | null;
          created_at: string;
          customer_email: string | null;
          customer_name: string;
          customer_phone: string | null;
          id: string;
          message: string;
          quoted_price: number | null;
          responded_at: string | null;
          response: string | null;
          service_id: string | null;
          shop_id: string;
          status: Database['public']['Enums']['enquiry_status'];
          subject: string;
          type: Database['public']['Enums']['enquiry_type'];
          updated_at: string;
          user_id: string;
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_year: number | null;
        };
        ComputedFields: never;
        Insert: {
          budget?: number | null;
          created_at?: string;
          customer_email?: string | null;
          customer_name: string;
          customer_phone?: string | null;
          id?: string;
          message: string;
          quoted_price?: number | null;
          responded_at?: string | null;
          response?: string | null;
          service_id?: string | null;
          shop_id: string;
          status?: Database['public']['Enums']['enquiry_status'];
          subject: string;
          type?: Database['public']['Enums']['enquiry_type'];
          updated_at?: string;
          user_id: string;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_year?: number | null;
        };
        Update: {
          budget?: number | null;
          created_at?: string;
          customer_email?: string | null;
          customer_name?: string;
          customer_phone?: string | null;
          id?: string;
          message?: string;
          quoted_price?: number | null;
          responded_at?: string | null;
          response?: string | null;
          service_id?: string | null;
          shop_id?: string;
          status?: Database['public']['Enums']['enquiry_status'];
          subject?: string;
          type?: Database['public']['Enums']['enquiry_type'];
          updated_at?: string;
          user_id?: string;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'enquiries_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'shop_services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enquiries_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enquiries_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          shop_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          shop_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          shop_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorites_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          data: NonNullable<Json>;
          id: string;
          is_read: boolean;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          is_read?: boolean;
          title: string;
          type?: Database['public']['Enums']['notification_type'];
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          is_read?: boolean;
          title?: string;
          type?: Database['public']['Enums']['notification_type'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          expo_push_token: string | null;
          full_name: string;
          id: string;
          is_suspended: boolean;
          phone: string | null;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          expo_push_token?: string | null;
          full_name?: string;
          id: string;
          is_suspended?: boolean;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          expo_push_token?: string | null;
          full_name?: string;
          id?: string;
          is_suspended?: boolean;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason: string;
          reporter_id: string;
          resolution_note: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          review_id: string | null;
          shop_id: string | null;
          status: Database['public']['Enums']['report_status'];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: string;
          reporter_id: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          review_id?: string | null;
          shop_id?: string | null;
          status?: Database['public']['Enums']['report_status'];
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          review_id?: string | null;
          shop_id?: string | null;
          status?: Database['public']['Enums']['report_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          comment: string;
          created_at: string;
          id: string;
          moderation_note: string | null;
          rating: number;
          shop_id: string;
          status: Database['public']['Enums']['review_status'];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          comment?: string;
          created_at?: string;
          id?: string;
          moderation_note?: string | null;
          rating: number;
          shop_id: string;
          status?: Database['public']['Enums']['review_status'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comment?: string;
          created_at?: string;
          id?: string;
          moderation_note?: string | null;
          rating?: number;
          shop_id?: string;
          status?: Database['public']['Enums']['review_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      service_categories: {
        Row: {
          color: string;
          created_at: string;
          description: string;
          icon_name: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          color?: string;
          created_at?: string;
          description?: string;
          icon_name?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          color?: string;
          created_at?: string;
          description?: string;
          icon_name?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      shop_images: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          image_url: string;
          shop_id: string;
          sort_order: number;
          storage_path: string | null;
        };
        ComputedFields: never;
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url: string;
          shop_id: string;
          sort_order?: number;
          storage_path?: string | null;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          image_url?: string;
          shop_id?: string;
          sort_order?: number;
          storage_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shop_images_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      shop_portfolio: {
        Row: {
          after_image_path: string | null;
          after_image_url: string;
          before_image_path: string | null;
          before_image_url: string;
          category_id: string | null;
          created_at: string;
          description: string;
          id: string;
          shop_id: string;
          title: string;
          updated_at: string;
          vehicle_make: string;
          vehicle_model: string;
          vehicle_year: number | null;
        };
        ComputedFields: never;
        Insert: {
          after_image_path?: string | null;
          after_image_url: string;
          before_image_path?: string | null;
          before_image_url: string;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          shop_id: string;
          title: string;
          updated_at?: string;
          vehicle_make: string;
          vehicle_model: string;
          vehicle_year?: number | null;
        };
        Update: {
          after_image_path?: string | null;
          after_image_url?: string;
          before_image_path?: string | null;
          before_image_url?: string;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          shop_id?: string;
          title?: string;
          updated_at?: string;
          vehicle_make?: string;
          vehicle_model?: string;
          vehicle_year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shop_portfolio_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'service_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shop_portfolio_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      shop_services: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string;
          duration_minutes: number | null;
          id: string;
          is_active: boolean;
          name: string;
          price_from: number;
          price_to: number | null;
          shop_id: string;
          unit: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean;
          name: string;
          price_from: number;
          price_to?: number | null;
          shop_id: string;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string;
          duration_minutes?: number | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          price_from?: number;
          price_to?: number | null;
          shop_id?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shop_services_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'service_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shop_services_shop_id_fkey';
            columns: ['shop_id'];
            isOneToOne: false;
            referencedRelation: 'shops';
            referencedColumns: ['id'];
          },
        ];
      };
      shops: {
        Row: {
          address: string;
          approved_at: string | null;
          city: string;
          cover_image_url: string | null;
          created_at: string;
          description: string;
          email: string | null;
          id: string;
          is_verified: boolean;
          latitude: number;
          location: unknown;
          logo_url: string | null;
          longitude: number;
          name: string;
          opening_hours: NonNullable<Json>;
          owner_id: string;
          phone: string;
          postcode: string | null;
          price_level: number;
          rating: number;
          rejection_reason: string | null;
          review_count: number;
          status: Database['public']['Enums']['shop_status'];
          updated_at: string;
          vehicle_brands: string[];
          website: string | null;
        };
        ComputedFields: never;
        Insert: {
          address: string;
          approved_at?: string | null;
          city: string;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string;
          email?: string | null;
          id?: string;
          is_verified?: boolean;
          latitude: number;
          location?: unknown;
          logo_url?: string | null;
          longitude: number;
          name: string;
          opening_hours?: NonNullable<Json>;
          owner_id: string;
          phone: string;
          postcode?: string | null;
          price_level?: number;
          rating?: number;
          rejection_reason?: string | null;
          review_count?: number;
          status?: Database['public']['Enums']['shop_status'];
          updated_at?: string;
          vehicle_brands?: string[];
          website?: string | null;
        };
        Update: {
          address?: string;
          approved_at?: string | null;
          city?: string;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string;
          email?: string | null;
          id?: string;
          is_verified?: boolean;
          latitude?: number;
          location?: unknown;
          logo_url?: string | null;
          longitude?: number;
          name?: string;
          opening_hours?: NonNullable<Json>;
          owner_id?: string;
          phone?: string;
          postcode?: string | null;
          price_level?: number;
          rating?: number;
          rejection_reason?: string | null;
          review_count?: number;
          status?: Database['public']['Enums']['shop_status'];
          updated_at?: string;
          vehicle_brands?: string[];
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shops_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_stats: { Args: Record<PropertyKey, never>; Returns: Json };
      become_shop_owner: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      booked_slots: {
        Args: { p_date: string; p_shop_id: string };
        Returns: string[];
      };
      can_manage_shop_media: {
        Args: { p_object_name: string };
        Returns: boolean;
      };
      get_review_authors: {
        Args: { p_user_ids: string[] };
        Returns: {
          avatar_url: string;
          full_name: string;
          id: string;
        }[];
      };
      has_role: {
        Args: { p_role: Database['public']['Enums']['user_role'] };
        Returns: boolean;
      };
      is_active_user: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_privileged_writer: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      notify_user: {
        Args: {
          p_body: string;
          p_data?: Json;
          p_title: string;
          p_type: Database['public']['Enums']['notification_type'];
          p_user_id: string;
        };
        Returns: undefined;
      };
      owns_shop: { Args: { p_shop_id: string }; Returns: boolean };
      refresh_shop_rating: { Args: { p_shop_id: string }; Returns: undefined };
      search_shops: {
        Args: {
          p_category_slugs?: string[];
          p_lat?: number;
          p_limit?: number;
          p_lng?: number;
          p_max_price_level?: number;
          p_min_rating?: number;
          p_offset?: number;
          p_query?: string;
          p_radius_km?: number;
          p_shop_ids?: string[];
          p_sort?: string;
        };
        Returns: {
          address: string;
          category_slugs: string[];
          city: string;
          cover_image_url: string;
          created_at: string;
          description: string;
          distance_km: number;
          email: string;
          id: string;
          is_verified: boolean;
          latitude: number;
          logo_url: string;
          longitude: number;
          min_price: number;
          name: string;
          opening_hours: Json;
          owner_id: string;
          phone: string;
          postcode: string;
          price_level: number;
          rating: number;
          review_count: number;
          status: Database['public']['Enums']['shop_status'];
          vehicle_brands: string[];
          website: string;
        }[];
      };
    };
    Enums: {
      booking_status:
        | 'pending'
        | 'confirmed'
        | 'rejected'
        | 'in_progress'
        | 'completed'
        | 'cancelled';
      enquiry_status: 'open' | 'responded' | 'closed';
      enquiry_type: 'general' | 'quote';
      notification_type: 'booking' | 'enquiry' | 'review' | 'shop' | 'system';
      report_status: 'open' | 'resolved' | 'dismissed';
      review_status: 'published' | 'hidden';
      shop_status: 'pending' | 'approved' | 'rejected' | 'suspended';
      user_role: 'customer' | 'shop_owner' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        'pending',
        'confirmed',
        'rejected',
        'in_progress',
        'completed',
        'cancelled',
      ],
      enquiry_status: ['open', 'responded', 'closed'],
      enquiry_type: ['general', 'quote'],
      notification_type: ['booking', 'enquiry', 'review', 'shop', 'system'],
      report_status: ['open', 'resolved', 'dismissed'],
      review_status: ['published', 'hidden'],
      shop_status: ['pending', 'approved', 'rejected', 'suspended'],
      user_role: ['customer', 'shop_owner', 'admin'],
    },
  },
} as const;
