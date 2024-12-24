/*
  # Add budgets and financial management features
  
  1. Updates
    - Add unique constraint to categories name
  
  2. New Tables
    - Budgets
    - Financial goals
    - Recurring transactions
    - Tags
    - Notifications
*/

-- Add unique constraint to categories
ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);

-- Budgets table
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category text REFERENCES categories(name) ON DELETE CASCADE,
  amount numeric NOT NULL,
  period text NOT NULL CHECK (period IN ('monthly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  alert_threshold numeric CHECK (alert_threshold BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Financial goals
CREATE TABLE financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  deadline date,
  category text NOT NULL CHECK (category IN ('savings', 'investment', 'debt', 'other')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recurring transactions
CREATE TABLE recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL,
  category text REFERENCES categories(name) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  last_processed_date date,
  next_date date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tags for transactions
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (name, user_id)
);

-- Transaction tags junction table
CREATE TABLE transaction_tags (
  transaction_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (transaction_id, tag_id)
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('budget_alert', 'goal_progress', 'recurring_transaction', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own budgets"
  ON budgets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own financial goals"
  ON financial_goals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own recurring transactions"
  ON recurring_transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tags"
  ON tags FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transaction tags"
  ON transaction_tags FOR ALL USING (
    EXISTS (
      SELECT 1 FROM purchases p
      WHERE p.id = transaction_tags.transaction_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own notifications"
  ON notifications FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_budgets_user_category ON budgets(user_id, category);
CREATE INDEX idx_goals_user_status ON financial_goals(user_id, status);
CREATE INDEX idx_recurring_next_date ON recurring_transactions(next_date);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);