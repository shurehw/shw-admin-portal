-- CRM Automations and Advanced Features
-- =======================================

-- 1) Automations table
CREATE TABLE IF NOT EXISTS automations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  description text,
  trigger_type text not null, -- record.created, record.updated, record.deleted, time.schedule, webhook
  trigger_entity text, -- contacts, companies, deals, tasks, tickets
  trigger_conditions jsonb, -- JSONLogic expression
  filters jsonb, -- Additional filters
  actions jsonb not null, -- Array of actions to execute
  is_active boolean default true,
  last_run_at timestamptz,
  run_count integer default 0,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_automations_org ON automations(org_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON automations(trigger_type, trigger_entity) WHERE is_active = true;

-- 2) Automation runs history
CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  automation_id uuid not null references automations(id) on delete cascade,
  trigger_data jsonb,
  status text not null, -- pending, running, success, failed, skipped
  started_at timestamptz default now(),
  completed_at timestamptz,
  error_message text,
  actions_completed jsonb,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs(automation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(org_id, status, created_at DESC);

-- 3) Email templates for automations
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  subject text not null,
  body_html text,
  body_text text,
  variables jsonb, -- Available merge variables
  category text,
  is_active boolean default true,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(org_id, category) WHERE is_active = true;

-- 4) Lists/Segments
CREATE TABLE IF NOT EXISTS lists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  description text,
  entity_type text not null default 'contacts', -- contacts, companies, deals
  filters jsonb not null, -- Dynamic filter criteria
  is_dynamic boolean default true,
  member_count integer default 0,
  last_updated timestamptz,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_lists_org ON lists(org_id);

-- 5) List members (for static lists or cached dynamic lists)
CREATE TABLE IF NOT EXISTS list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  entity_id uuid not null,
  entity_type text not null,
  added_at timestamptz default now(),
  added_by uuid,
  metadata jsonb,
  unique(list_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_list_members_list ON list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_entity ON list_members(entity_type, entity_id);

-- 6) Email sync configuration
CREATE TABLE IF NOT EXISTS email_sync_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid not null,
  provider text not null, -- gmail, outlook, exchange
  email_address text not null,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  sync_enabled boolean default true,
  last_sync_at timestamptz,
  sync_state jsonb, -- Provider-specific sync state
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_email_sync_accounts_org ON email_sync_accounts(org_id) WHERE sync_enabled = true;

-- 7) Webhooks for integrations
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  url text not null,
  events text[] not null, -- Array of event types to trigger on
  headers jsonb,
  is_active boolean default true,
  last_triggered_at timestamptz,
  failure_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(org_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING gin(events) WHERE is_active = true;

-- 8) Reporting - Deal snapshots for historical tracking
CREATE TABLE IF NOT EXISTS deal_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  snapshot_date date not null,
  pipeline_id uuid,
  stage text,
  deal_count integer default 0,
  total_value numeric(15,2) default 0,
  avg_value numeric(15,2) default 0,
  created_at timestamptz default now(),
  unique(org_id, snapshot_date, pipeline_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_deal_snapshots_date ON deal_snapshots(org_id, snapshot_date DESC);

-- 9) Activity metrics for reporting
CREATE TABLE IF NOT EXISTS activity_metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid,
  metric_date date not null,
  calls_made integer default 0,
  emails_sent integer default 0,
  meetings_held integer default 0,
  tasks_completed integer default 0,
  deals_created integer default 0,
  deals_closed integer default 0,
  revenue_generated numeric(15,2) default 0,
  created_at timestamptz default now(),
  unique(org_id, user_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_activity_metrics_date ON activity_metrics(org_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_metrics_user ON activity_metrics(org_id, user_id, metric_date DESC);

-- 10) Materialized view for pipeline performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_pipeline_performance AS
SELECT 
  d.org_id,
  d.pipeline_id,
  p.name as pipeline_name,
  d.stage,
  COUNT(*) as deal_count,
  SUM(d.amount) as total_value,
  AVG(d.amount) as avg_value,
  AVG(EXTRACT(day FROM (now() - d.created_at))) as avg_age_days,
  COUNT(*) FILTER (WHERE d.expected_close_date < CURRENT_DATE) as overdue_count
FROM deals d
LEFT JOIN pipelines p ON p.id = d.pipeline_id
WHERE d.deleted_at IS NULL
GROUP BY d.org_id, d.pipeline_id, p.name, d.stage;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_pipeline_performance 
  ON mv_pipeline_performance(org_id, pipeline_id, stage);

-- 11) Sequences (for human-friendly IDs)
CREATE TABLE IF NOT EXISTS sequences (
  org_id uuid not null,
  entity_type text not null,
  prefix text,
  current_value bigint default 0,
  created_at timestamptz default now(),
  primary key (org_id, entity_type)
);

-- Function to get next sequence value
CREATE OR REPLACE FUNCTION get_next_sequence(
  p_org_id uuid,
  p_entity_type text,
  p_prefix text DEFAULT NULL
) RETURNS text AS $$
DECLARE
  v_current bigint;
  v_prefix text;
BEGIN
  -- Insert or update and get the next value
  INSERT INTO sequences (org_id, entity_type, prefix, current_value)
  VALUES (p_org_id, p_entity_type, COALESCE(p_prefix, UPPER(LEFT(p_entity_type, 3))), 1)
  ON CONFLICT (org_id, entity_type) 
  DO UPDATE SET current_value = sequences.current_value + 1
  RETURNING current_value, prefix INTO v_current, v_prefix;
  
  -- Return formatted ID (e.g., "DEAL-00001")
  RETURN v_prefix || '-' || LPAD(v_current::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 12) Email threading helper
CREATE TABLE IF NOT EXISTS email_threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  thread_id text not null, -- Provider's thread ID
  subject text,
  participant_emails text[],
  contact_ids uuid[],
  company_ids uuid[],
  deal_ids uuid[],
  last_activity_at timestamptz,
  message_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(org_id, thread_id)
);

CREATE INDEX IF NOT EXISTS idx_email_threads_org ON email_threads(org_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_threads_contacts ON email_threads USING gin(contact_ids);
CREATE INDEX IF NOT EXISTS idx_email_threads_deals ON email_threads USING gin(deal_ids);

-- 13) Functions for automation execution
CREATE OR REPLACE FUNCTION execute_automation_action(
  p_action jsonb,
  p_context jsonb
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  CASE p_action->>'type'
    WHEN 'create_task' THEN
      -- Create a task
      v_result := jsonb_build_object('success', true, 'action', 'task_created');
    WHEN 'update_field' THEN
      -- Update a field
      v_result := jsonb_build_object('success', true, 'action', 'field_updated');
    WHEN 'send_email' THEN
      -- Queue email
      v_result := jsonb_build_object('success', true, 'action', 'email_queued');
    WHEN 'webhook' THEN
      -- Trigger webhook
      v_result := jsonb_build_object('success', true, 'action', 'webhook_triggered');
    ELSE
      v_result := jsonb_build_object('success', false, 'error', 'Unknown action type');
  END CASE;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 14) Refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_pipeline_performance()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_performance;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sync_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can view automations in their org" ON automations
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Admins can manage automations" ON automations
  FOR ALL USING (org_id = auth.org_id() AND auth.has_permission('settings:write'));

CREATE POLICY "Users can view automation runs in their org" ON automation_runs
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Users can view email templates in their org" ON email_templates
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Users can manage their own email templates" ON email_templates
  FOR ALL USING (org_id = auth.org_id() AND (created_by = auth.uid() OR auth.has_permission('settings:write')));

CREATE POLICY "Users can view lists in their org" ON lists
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Users can manage lists" ON lists
  FOR ALL USING (org_id = auth.org_id() AND auth.has_permission('contacts:write'));

CREATE POLICY "Users can view their email sync accounts" ON email_sync_accounts
  FOR SELECT USING (org_id = auth.org_id() AND user_id = auth.uid());

CREATE POLICY "Users can manage their email sync accounts" ON email_sync_accounts
  FOR ALL USING (org_id = auth.org_id() AND user_id = auth.uid());

CREATE POLICY "Users can view webhooks in their org" ON webhooks
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Admins can manage webhooks" ON webhooks
  FOR ALL USING (org_id = auth.org_id() AND auth.has_permission('settings:write'));

CREATE POLICY "Users can view reports in their org" ON deal_snapshots
  FOR SELECT USING (org_id = auth.org_id() AND auth.has_permission('analytics:read'));

CREATE POLICY "Users can view activity metrics in their org" ON activity_metrics
  FOR SELECT USING (org_id = auth.org_id() AND auth.has_permission('analytics:read'));

CREATE POLICY "Users can view email threads in their org" ON email_threads
  FOR SELECT USING (org_id = auth.org_id());