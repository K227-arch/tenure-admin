import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          status: string;
          membership_type: string | null;
          joined_at: string;
          last_active: string | null;
          avatar: string | null;
          phone: string | null;
          address: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: string;
          status?: string;
          membership_type?: string | null;
          joined_at?: string;
          last_active?: string | null;
          avatar?: string | null;
          phone?: string | null;
          address?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: string;
          status?: string;
          membership_type?: string | null;
          joined_at?: string;
          last_active?: string | null;
          avatar?: string | null;
          phone?: string | null;
          address?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          currency: string;
          status: string;
          description: string | null;
          metadata: any | null;
          processed_at: string | null;
          created_at: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          status: string;
          current_period_start: string;
          current_period_end: string;
          plan_id: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};