export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // The users view combines user_profiles and auth.users
      users: {
        Row: {
          id: string
          auth_user_id: string
          owner_id: string
          email: string | null
          name: string
          type: 'Adult' | 'Child'
          monthly_income: number
          card_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: never  // View is not insertable
        Update: never  // View is not updatable
      },
      // The actual user_profiles table
      user_profiles: {
        Row: {
          id: string
          auth_user_id: string
          owner_id: string
          name: string
          type: 'Adult' | 'Child'
          monthly_income: number
          card_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          owner_id: string
          name: string
          type: 'Adult' | 'Child'
          monthly_income?: number
          card_number?: string | null
        }
        Update: Partial<Omit<Database['public']['Tables']['user_profiles']['Insert'], 'auth_user_id' | 'owner_id'>>
      }
      salary_history: {
        Row: {
          id: string
          user_id: string
          amount: number
          month: number
          year: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          amount: number
          month: number
          year: number
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['salary_history']['Insert']>
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
          description: string | null
          date: string
          total_amount: number | null
          split_between: number
          created_at: string
        }
        Insert: {
          user_id: string
          amount: number
          category: string
          description?: string | null
          date: string
          total_amount?: number | null
          split_between: number
        }
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'fixed' | 'flexible'
          created_at: string
        }
        Insert: {
          name: string
          type: 'fixed' | 'flexible'
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      savings: {
        Row: {
          id: string
          amount: number
          date: string
          created_at: string
        }
        Insert: {
          amount: number
          date: string
        }
        Update: Partial<Database['public']['Tables']['savings']['Insert']>
      }
      budgets: {
        Row: {
          id: string
          category: string
          amount: number
          type: 'fixed' | 'flexible'
          month: string
          created_at: string
        }
        Insert: {
          category: string
          amount: number
          type: 'fixed' | 'flexible'
          month: string
        }
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>
      }
    }
  }
}