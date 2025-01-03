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
      users: {
        Row: {
          id: string
          email: string | null
          name: string
          type: 'Adult' | 'Child'
          monthly_income: number
          card_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          email?: string | null
          name: string
          type: 'Adult' | 'Child'
          monthly_income: number
          card_number?: string | null
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
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
        Insert: Omit<SalaryHistory['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<SalaryHistory['Insert']>
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
        Insert: Omit<Purchases['Row'], 'id' | 'created_at'>
        Update: Partial<Purchases['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'fixed' | 'flexible'
          created_at: string
        }
        Insert: Omit<Categories['Row'], 'id' | 'created_at'>
        Update: Partial<Categories['Insert']>
      }
      savings: {
        Row: {
          id: string
          amount: number
          date: string
          created_at: string
        }
        Insert: Omit<Savings['Row'], 'id' | 'created_at'>
        Update: Partial<Savings['Insert']>
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