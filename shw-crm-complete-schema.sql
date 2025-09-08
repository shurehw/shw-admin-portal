-- Complete SHW/Shureprint CRM Schema
-- Builds on the minimal CRM schema with full feature set

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =====================================================
-- EXISTING TABLES (from minimal-crm-schema.sql)
-- =====================================================
-- companies, contacts, company_domains, blocked_domains, field_definitions
-- These are already defined, so we'll add the new tables

-- =====================================================
-- USER MANAGEMENT
-- =====================================================

-- Users table (for role-based access)
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email citext NOT NULL UNIQUE,
  first_name text,
  last_name text,
  role text NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'manager', 'sales', 'cs', 'readonly')),
  team_id uuid, -- For manager scoping
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- CORE CRM ENTITIES
-- =====================================================

-- Activities (communications and interactions)
CREATE TABLE activities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('email_in', 'email_out', 'call', 'sms_in', 'sms_out', 'meeting', 'note', 'event')),
  subject text NOT NULL,
  body text,
  direction text CHECK (direction IN ('in', 'out')) NULL,
  
  -- Relations
  related_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  related_company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id),
  
  -- External system integration
  external_refs jsonb DEFAULT '{}', -- message-id, thread-id, etc.
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure at least one relation
  CONSTRAINT activity_must_relate CHECK (related_contact_id IS NOT NULL OR related_company_id IS NOT NULL)
);

-- Tasks (todo items and follow-ups)
CREATE TABLE tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'done')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  
  -- Scheduling
  due_date date,
  completed_at timestamptz,
  
  -- Relations
  owner_id uuid REFERENCES users(id),
  related_contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  related_company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure at least one relation
  CONSTRAINT task_must_relate CHECK (related_contact_id IS NOT NULL OR related_company_id IS NOT NULL)
);

-- Deals (sales opportunities)
CREATE TABLE deals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'qualified', 'proposal', 'verbal', 'closed_won', 'closed_lost')),
  amount numeric(12,2),
  probability integer DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  close_date date,
  
  -- Relations
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  primary_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES users(id),
  
  -- Additional data
  props jsonb NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tickets (service desk)
CREATE TABLE tickets (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'support' CHECK (type IN ('support', 'delivery', 'billing', 'quality', 'other')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'ack', 'in_progress', 'waiting_customer', 'closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- SLA tracking
  sla_due timestamptz,
  first_response_at timestamptz,
  
  -- Relations
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES users(id),
  
  -- External refs for email threading
  external_refs jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Target Lists (saved searches and segments)
CREATE TABLE target_lists (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  entity text NOT NULL CHECK (entity IN ('company', 'contact')),
  definition jsonb NOT NULL, -- Filter tree structure
  is_smart boolean DEFAULT true, -- Recalculates vs static membership
  
  -- Ownership
  owner_id uuid REFERENCES users(id),
  is_shared boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit Log (track all changes)
CREATE TABLE audit_log (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  entity text NOT NULL, -- 'contact', 'company', 'deal', etc.
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'merge')),
  before_data jsonb,
  after_data jsonb,
  at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_team_role ON users(team_id, role);

-- Activities
CREATE INDEX idx_activities_contact ON activities(related_contact_id, created_at DESC);
CREATE INDEX idx_activities_company ON activities(related_company_id, created_at DESC);
CREATE INDEX idx_activities_type_created ON activities(type, created_at DESC);
CREATE INDEX idx_activities_created_by ON activities(created_by);

-- Tasks
CREATE INDEX idx_tasks_owner_status ON tasks(owner_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status != 'done';
CREATE INDEX idx_tasks_contact ON tasks(related_contact_id);
CREATE INDEX idx_tasks_company ON tasks(related_company_id);
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);

-- Deals
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_close_date ON deals(close_date);
CREATE INDEX idx_deals_amount ON deals(amount DESC);

-- Tickets
CREATE INDEX idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX idx_tickets_owner ON tickets(owner_id);
CREATE INDEX idx_tickets_company ON tickets(company_id);
CREATE INDEX idx_tickets_sla_due ON tickets(sla_due) WHERE status NOT IN ('closed');
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- Target Lists
CREATE INDEX idx_target_lists_owner ON target_lists(owner_id);
CREATE INDEX idx_target_lists_entity ON target_lists(entity);

-- Audit Log
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id, at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id, at DESC);
CREATE INDEX idx_audit_log_at ON audit_log(at DESC);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Update updated_at timestamp for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_target_lists_updated_at BEFORE UPDATE ON target_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-complete tasks when status changes to done
CREATE OR REPLACE FUNCTION auto_complete_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_auto_complete_task
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_task();

-- Auto-set first_response_at on tickets when status changes from 'new'
CREATE OR REPLACE FUNCTION auto_set_first_response()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'new' AND NEW.status != 'new' AND NEW.first_response_at IS NULL THEN
    NEW.first_response_at = now();
  END IF;
  
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = now();
  ELSIF NEW.status != 'closed' AND OLD.status = 'closed' THEN
    NEW.closed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_auto_set_first_response
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_first_response();

-- Update last activity dates on companies/contacts
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update contact last_activity_date if activity relates to contact
  IF NEW.related_contact_id IS NOT NULL THEN
    UPDATE contacts 
    SET props = props || jsonb_build_object('last_activity_date', NEW.created_at::text)
    WHERE id = NEW.related_contact_id;
  END IF;
  
  -- Update company last_activity_date if activity relates to company
  IF NEW.related_company_id IS NOT NULL THEN
    UPDATE companies 
    SET props = props || jsonb_build_object('last_activity_date', NEW.created_at::text)
    WHERE id = NEW.related_company_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_last_activity
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity();

-- Audit logging trigger
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
  actor_id_val uuid;
  entity_name text;
BEGIN
  -- Get actor from current user context (set by application)
  SELECT current_setting('app.current_user_id', true)::uuid INTO actor_id_val;
  
  -- Determine entity name from table name
  entity_name := TG_TABLE_NAME;
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (actor_id, entity, entity_id, action, before_data, after_data)
    VALUES (actor_id_val, entity_name, OLD.id, 'delete', to_jsonb(OLD), NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (actor_id, entity, entity_id, action, before_data, after_data)
    VALUES (actor_id_val, entity_name, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (actor_id, entity, entity_id, action, before_data, after_data)
    VALUES (actor_id_val, entity_name, NEW.id, 'create', NULL, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply audit triggers to main tables
CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_contacts AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_deals AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_tickets AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Default users (will need proper auth integration)
INSERT INTO users (email, first_name, last_name, role) VALUES
('admin@shurehw.com', 'System', 'Admin', 'admin'),
('sales@shurehw.com', 'Sales', 'User', 'sales'),
('support@shurehw.com', 'Support', 'User', 'cs')
ON CONFLICT (email) DO NOTHING;

-- Update blocked domains to include more personal providers
INSERT INTO blocked_domains (domain) VALUES 
('gmail.com'), ('yahoo.com'), ('hotmail.com'), ('outlook.com'), 
('icloud.com'), ('aol.com'), ('live.com'), ('msn.com'), 
('me.com'), ('ymail.com'), ('gmx.com'), ('proton.me'), ('mail.ru'),
('protonmail.com'), ('tutanota.com'), ('zoho.com'), ('mail.com')
ON CONFLICT (domain) DO NOTHING;

-- Sample pipeline stages configuration in field_definitions
INSERT INTO field_definitions (entity, key, label, type, options, "group", "order", system) VALUES
('deal', 'stage', 'Pipeline Stage', 'enum', '{"values": ["new", "qualified", "proposal", "verbal", "closed_won", "closed_lost"]}', 'Pipeline', 10, true),
('deal', 'priority', 'Priority', 'enum', '{"values": ["low", "normal", "high"]}', 'Details', 20, true),
('ticket', 'type', 'Ticket Type', 'enum', '{"values": ["support", "delivery", "billing", "quality", "other"]}', 'Classification', 10, true),
('ticket', 'priority', 'Priority', 'enum', '{"values": ["low", "normal", "high", "urgent"]}', 'Classification', 20, true),
('activity', 'type', 'Activity Type', 'enum', '{"values": ["email_in", "email_out", "call", "sms_in", "sms_out", "meeting", "note", "event"]}', 'Type', 10, true)
ON CONFLICT (entity, key) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can see their own records + admins see all
CREATE POLICY users_policy ON users FOR ALL
  USING (
    id = (current_setting('app.current_user_id', true))::uuid OR 
    (SELECT role FROM users WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- Activities: see own + team data, admins see all
CREATE POLICY activities_policy ON activities FOR ALL
  USING (
    created_by = (current_setting('app.current_user_id', true))::uuid OR
    (SELECT role FROM users WHERE id = (current_setting('app.current_user_id', true))::uuid) IN ('admin', 'manager')
  );

-- Tasks: see own tasks + team data for managers
CREATE POLICY tasks_policy ON tasks FOR ALL
  USING (
    owner_id = (current_setting('app.current_user_id', true))::uuid OR
    (SELECT role FROM users WHERE id = (current_setting('app.current_user_id', true))::uuid) IN ('admin', 'manager')
  );

-- Deals: see own + team data
CREATE POLICY deals_policy ON deals FOR ALL
  USING (
    owner_id = (current_setting('app.current_user_id', true))::uuid OR
    (SELECT role FROM users WHERE id = (current_setting('app.current_user_id', true))::uuid) IN ('admin', 'manager')
  );

-- Tickets: see own + team data  
CREATE POLICY tickets_policy ON tickets FOR ALL
  USING (
    owner_id = (current_setting('app.current_user_id', true))::uuid OR
    (SELECT role FROM users WHERE id = (current_setting('app.current_user_id', true))::uuid) IN ('admin', 'manager')
  );

-- Target lists: see own + shared lists
CREATE POLICY target_lists_policy ON target_lists FOR ALL
  USING (
    owner_id = (current_setting('app.current_user_id', true))::uuid OR
    is_shared = true OR
    (SELECT role FROM users WHERE id = (current_setting('app.current_user_id', true))::uuid) IN ('admin', 'manager')
  );

-- Audit log: admins only
CREATE POLICY audit_log_policy ON audit_log FOR ALL
  USING (
    (SELECT role FROM users WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Recent activities with related entity names
CREATE OR REPLACE VIEW recent_activities AS
SELECT 
  a.*,
  c.first_name || ' ' || c.last_name as contact_name,
  c.email as contact_email,
  co.name as company_name,
  u.first_name || ' ' || u.last_name as created_by_name
FROM activities a
LEFT JOIN contacts c ON a.related_contact_id = c.id
LEFT JOIN companies co ON a.related_company_id = co.id
LEFT JOIN users u ON a.created_by = u.id
ORDER BY a.created_at DESC;

-- Overdue tasks summary  
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT 
  t.*,
  c.first_name || ' ' || c.last_name as contact_name,
  co.name as company_name,
  u.first_name || ' ' || u.last_name as owner_name
FROM tasks t
LEFT JOIN contacts c ON t.related_contact_id = c.id
LEFT JOIN companies co ON t.related_company_id = co.id  
LEFT JOIN users u ON t.owner_id = u.id
WHERE t.status != 'done' 
  AND t.due_date < CURRENT_DATE
ORDER BY t.due_date ASC, t.priority DESC;

-- Deal pipeline summary
CREATE OR REPLACE VIEW deal_pipeline AS
SELECT 
  d.*,
  co.name as company_name,
  c.first_name || ' ' || c.last_name as primary_contact_name,
  u.first_name || ' ' || u.last_name as owner_name
FROM deals d
JOIN companies co ON d.company_id = co.id
LEFT JOIN contacts c ON d.primary_contact_id = c.id
LEFT JOIN users u ON d.owner_id = u.id
WHERE d.stage NOT IN ('closed_won', 'closed_lost')
ORDER BY d.close_date ASC NULLS LAST, d.amount DESC NULLS LAST;