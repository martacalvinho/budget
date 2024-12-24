/*
  # Income Management Enhancement

  1. New Tables
    - `income_sources`
      - Base income sources (salary, recurring payments, etc.)
    - `income_adjustments`
      - Additional income entries (bonuses, gifts, etc.)
    - `predictions`
      - Future income and expense predictions

  2. Changes
    - Modified income tracking to support variable monthly income
    - Added support for multiple income sources per user
    - Added prediction capabilities

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Income sources table
CREATE TABLE income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('salary', 'recurring', 'other')),
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'irregular')),
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their income sources"
  ON income_sources
  USING (auth.uid() = user_id);

-- Income adjustments table
CREATE TABLE income_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  source_id uuid REFERENCES income_sources(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date date NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('bonus', 'gift', 'adjustment', 'other')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE income_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their income adjustments"
  ON income_adjustments
  USING (auth.uid() = user_id);

-- Predictions table
CREATE TABLE predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  category text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  notes text,
  confidence numeric CHECK (confidence BETWEEN 0 AND 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, year, month, category, type)
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their predictions"
  ON predictions
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX idx_income_adjustments_user_id ON income_adjustments(user_id);
CREATE INDEX idx_income_adjustments_date ON income_adjustments(date);
CREATE INDEX idx_predictions_user_year_month ON predictions(user_id, year, month);