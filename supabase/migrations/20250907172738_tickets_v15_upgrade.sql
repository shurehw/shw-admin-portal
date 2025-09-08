-- Enhanced Tickets System v1.5 Migration
-- Adds comprehensive fields for SLA, assignments, related entities, and outcomes

-- Add new columns to tickets table
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'new' CHECK (status IN ('new', 'ack', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'p3' CHECK (priority IN ('p1', 'p2', 'p3', 'p4')),
  ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('order_issue', 'rma', 'damage', 'billing', 'custom_print', 'shipping', 'quality', 'other')),
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS followers uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS contact_id uuid,
  ADD COLUMN IF NOT EXISTS order_id text,
  ADD COLUMN IF NOT EXISTS invoice_id text,
  ADD COLUMN IF NOT EXISTS po_id text,
  ADD COLUMN IF NOT EXISTS vendor_id uuid,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS sla_plan_id uuid,
  ADD COLUMN IF NOT EXISTS first_response_due timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_due timestamptz,
  ADD COLUMN IF NOT EXISTS next_update_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_code text,
  ADD COLUMN IF NOT EXISTS credit_memo_id text,
  ADD COLUMN IF NOT EXISTS rma_id text,
  ADD COLUMN IF NOT EXISTS root_cause text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Messages table (public vs internal)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id),
  author_name text,
  is_internal boolean DEFAULT false,
  body text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events/audit log
CREATE TABLE IF NOT EXISTS ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  actor_name text,
  kind text NOT NULL, -- status_changed, assigned, priority_changed, merged, macro_applied, etc.
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- SLA plans
CREATE TABLE IF NOT EXISTS sla_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  first_response_minutes integer NOT NULL,
  resolution_minutes integer NOT NULL,
  is_default boolean DEFAULT false,
  conditions jsonb DEFAULT '{}'::jsonb, -- e.g., {"priority": "p1", "type": "damage"}
  created_at timestamptz DEFAULT now()
);

-- Macros/canned responses
CREATE TABLE IF NOT EXISTS ticket_macros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  category text,
  body text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_company ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON ticket_events(ticket_id);

-- Insert default SLA plans
INSERT INTO sla_plans (name, first_response_minutes, resolution_minutes, is_default)
VALUES 
  ('Standard', 120, 1440, true), -- 2 hours, 24 hours
  ('Priority', 30, 240, false),  -- 30 min, 4 hours
  ('VIP', 15, 120, false)        -- 15 min, 2 hours
ON CONFLICT DO NOTHING;

-- Insert default macros
INSERT INTO ticket_macros (org_id, name, category, body, is_internal)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'Greeting', 'general', 
   'Hi {first_name},' || E'\n\n' || 'Thank you for reaching out. We''re reviewing your request and will get back to you shortly.', false),
  ('00000000-0000-0000-0000-000000000000', 'Damage Intake', 'damage', 
   'To process your damage claim, please provide:' || E'\n' || '- Photos of the damaged items' || E'\n' || '- Quantity affected' || E'\n' || '- Order or PO number' || E'\n' || '- Date received', false),
  ('00000000-0000-0000-0000-000000000000', 'RMA Approval', 'rma', 
   'Your RMA has been approved. RMA #{rma_number}' || E'\n\n' || 'Please ship items to:' || E'\n' || '[Return address]' || E'\n\n' || 'Include this RMA number on the package.', false),
  ('00000000-0000-0000-0000-000000000000', 'Internal Escalation', 'internal', 
   'Escalating to management. Customer is VIP account.' || E'\n' || 'Previous issues: {history}', true)
ON CONFLICT DO NOTHING;

-- Function to calculate SLA breach time
CREATE OR REPLACE FUNCTION calculate_sla_breach(due_time timestamptz)
RETURNS interval AS $$
BEGIN
  RETURN due_time - now();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set SLA times on ticket creation
CREATE OR REPLACE FUNCTION set_ticket_sla()
RETURNS trigger AS $$
DECLARE
  sla_record record;
BEGIN
  -- Get appropriate SLA plan based on priority
  SELECT * INTO sla_record FROM sla_plans 
  WHERE (NEW.priority = 'p1' AND name = 'Priority')
     OR (NEW.is_vip = true AND name = 'VIP')
     OR is_default = true
  ORDER BY 
    CASE WHEN NEW.priority = 'p1' THEN 1
         WHEN NEW.is_vip = true THEN 2
         ELSE 3 END
  LIMIT 1;
  
  -- Set SLA deadlines
  NEW.first_response_due := now() + (sla_record.first_response_minutes || ' minutes')::interval;
  NEW.resolution_due := now() + (sla_record.resolution_minutes || ' minutes')::interval;
  NEW.sla_plan_id := sla_record.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_sla
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_sla();

-- Trigger to log events
CREATE OR REPLACE FUNCTION log_ticket_event()
RETURNS trigger AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_events (ticket_id, kind, meta)
    VALUES (NEW.id, 'status_changed', 
      jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  
  -- Log priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO ticket_events (ticket_id, kind, meta)
    VALUES (NEW.id, 'priority_changed',
      jsonb_build_object('from', OLD.priority, 'to', NEW.priority));
  END IF;
  
  -- Log assignment changes
  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
    INSERT INTO ticket_events (ticket_id, kind, meta)
    VALUES (NEW.id, 'assigned',
      jsonb_build_object('from', OLD.assignee_id, 'to', NEW.assignee_id));
  END IF;
  
  -- Track first response time
  IF OLD.status = 'new' AND NEW.status != 'new' AND NEW.first_responded_at IS NULL THEN
    NEW.first_responded_at := now();
  END IF;
  
  -- Track resolution time
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at := now();
  END IF;
  
  -- Track close time
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_ticket_events
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_event();

-- RLS policies
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_macros ENABLE ROW LEVEL SECURITY;

-- Everyone can read their org's ticket messages
CREATE POLICY "Users can read ticket messages" ON ticket_messages
  FOR SELECT USING (true);

-- Only authenticated users can create messages
CREATE POLICY "Users can create ticket messages" ON ticket_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Similar for events
CREATE POLICY "Users can read ticket events" ON ticket_events
  FOR SELECT USING (true);

CREATE POLICY "System can create ticket events" ON ticket_events
  FOR INSERT WITH CHECK (true);