/*
  # Add reporting and analytics features

  1. New Tables
    - `reports`
      - Custom saved reports
    - `report_schedules`
      - Automated report generation
    - `analytics_preferences`
      - User preferences for analytics
*/

-- Reports
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('expense', 'income', 'savings', 'budget', 'custom')),
  parameters jsonb NOT NULL DEFAULT '{}',
  layout jsonb,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Report schedules
CREATE TABLE report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  recipients jsonb NOT NULL DEFAULT '[]',
  active boolean DEFAULT true,
  last_sent_at timestamptz,
  next_send_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analytics preferences
CREATE TABLE analytics_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_currency text DEFAULT 'EUR',
  default_date_range text DEFAULT 'month',
  custom_categories jsonb DEFAULT '[]',
  dashboard_widgets jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own reports"
  ON reports FOR ALL USING (
    auth.uid() = user_id OR is_public = true
  );

CREATE POLICY "Users can manage their report schedules"
  ON report_schedules FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_schedules.report_id
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their analytics preferences"
  ON analytics_preferences FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_reports_user_type ON reports(user_id, type);
CREATE INDEX idx_report_schedules_next ON report_schedules(next_send_at);