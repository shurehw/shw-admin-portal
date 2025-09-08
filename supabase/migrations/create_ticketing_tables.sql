-- Ticketing System Tables for Supabase

-- First, ensure companies and contacts tables exist (create if not)
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  title VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drop existing tables if they exist
DROP TABLE IF EXISTS ticket_events CASCADE;
DROP TABLE IF EXISTS ticket_watchers CASCADE;
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS ticket_statuses CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS sla_policies CASCADE;
DROP TABLE IF EXISTS macros CASCADE;
DROP TABLE IF EXISTS routing_rules CASCADE;
DROP TABLE IF EXISTS saved_views CASCADE;

-- Ticket Statuses
CREATE TABLE ticket_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  order_index INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  color VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Types
CREATE TABLE ticket_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  default_team VARCHAR(100),
  default_priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SLA Policies
CREATE TABLE sla_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  first_response_minutes INTEGER,
  resolution_minutes INTEGER,
  business_hours_only BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main Tickets Table
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number SERIAL UNIQUE NOT NULL,
  org_id VARCHAR(100) NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  order_id VARCHAR(100),
  
  -- Core fields
  subject VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'normal',
  type VARCHAR(50) DEFAULT 'general',
  channel VARCHAR(50) DEFAULT 'portal',
  
  -- Assignment
  team VARCHAR(100),
  owner_id VARCHAR(100),
  owner_name VARCHAR(200),
  
  -- SLA tracking
  sla_policy_id UUID REFERENCES sla_policies(id),
  sla_due TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Tracking
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_tickets_company ON tickets(company_id);
CREATE INDEX idx_tickets_contact ON tickets(contact_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_owner ON tickets(owner_id);
CREATE INDEX idx_tickets_team ON tickets(team);
CREATE INDEX idx_tickets_sla_due ON tickets(sla_due);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);

-- Ticket Messages
CREATE TABLE ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('public_reply', 'internal_note')),
  body TEXT NOT NULL,
  html_body TEXT,
  
  -- Author info
  author_id VARCHAR(100),
  author_name VARCHAR(200),
  author_email VARCHAR(255),
  author_type VARCHAR(20) DEFAULT 'agent',
  
  -- Email threading
  message_id VARCHAR(255),
  in_reply_to VARCHAR(255),
  email_references TEXT,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for messages
CREATE INDEX idx_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_messages_created ON ticket_messages(created_at DESC);

-- Ticket Watchers
CREATE TABLE ticket_watchers (
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ticket_id, user_id)
);

-- Ticket Events (Audit Log)
CREATE TABLE ticket_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  data JSONB DEFAULT '{}',
  user_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for events
CREATE INDEX idx_events_ticket ON ticket_events(ticket_id);
CREATE INDEX idx_events_type ON ticket_events(event_type);
CREATE INDEX idx_events_created ON ticket_events(created_at DESC);

-- Macros
CREATE TABLE macros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  team VARCHAR(100),
  actions JSONB NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for macros
CREATE INDEX idx_macros_team ON macros(team);

-- Routing Rules
CREATE TABLE routing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  order_index INTEGER UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved Views
CREATE TABLE saved_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  filters JSONB NOT NULL,
  team VARCHAR(100),
  user_id VARCHAR(100),
  is_public BOOLEAN DEFAULT false,
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for saved views
CREATE INDEX idx_views_team ON saved_views(team);
CREATE INDEX idx_views_user ON saved_views(user_id);

-- Insert default statuses
INSERT INTO ticket_statuses (name, order_index, is_default, is_closed, color) VALUES
  ('new', 1, true, false, 'purple'),
  ('acknowledged', 2, false, false, 'blue'),
  ('in_progress', 3, false, false, 'yellow'),
  ('waiting_customer', 4, false, false, 'orange'),
  ('resolved', 5, false, true, 'green'),
  ('closed', 6, false, true, 'gray');

-- Insert default ticket types
INSERT INTO ticket_types (name, description, default_priority) VALUES
  ('order_issue', 'Problems with orders', 'high'),
  ('shipping_delay', 'Shipping and delivery issues', 'high'),
  ('product_defect', 'Product quality issues', 'urgent'),
  ('billing_question', 'Billing and payment inquiries', 'normal'),
  ('account_access', 'Login and account issues', 'normal'),
  ('feature_request', 'Feature requests and suggestions', 'low'),
  ('general_inquiry', 'General questions', 'low');

-- Insert default SLA policies
INSERT INTO sla_policies (name, priority, first_response_minutes, resolution_minutes, business_hours_only) VALUES
  ('Urgent SLA', 'urgent', 30, 240, false),
  ('High Priority SLA', 'high', 60, 480, true),
  ('Normal Priority SLA', 'normal', 240, 1440, true),
  ('Low Priority SLA', 'low', 480, 2880, true);

-- Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (adjust based on your auth setup)
CREATE POLICY "Users can view tickets in their org" ON tickets
  FOR SELECT USING (true); -- Adjust based on your auth

CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (true); -- Adjust based on your auth

CREATE POLICY "Users can update their tickets" ON tickets
  FOR UPDATE USING (true); -- Adjust based on your auth

CREATE POLICY "Users can view ticket messages" ON ticket_messages
  FOR SELECT USING (true); -- Adjust based on your auth

CREATE POLICY "Users can create messages" ON ticket_messages
  FOR INSERT WITH CHECK (true); -- Adjust based on your auth

-- Create helper functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ticket_messages_updated_at BEFORE UPDATE ON ticket_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to auto-assign ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := nextval('tickets_ticket_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Function to log ticket events
CREATE OR REPLACE FUNCTION log_ticket_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_events (ticket_id, event_type, data, user_id)
  VALUES (
    NEW.id,
    TG_ARGV[0],
    jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    ),
    current_setting('app.current_user_id', true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add event logging triggers
CREATE TRIGGER log_ticket_created AFTER INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION log_ticket_event('created');

CREATE TRIGGER log_ticket_updated AFTER UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION log_ticket_event('updated');

CREATE TRIGGER log_ticket_status_changed AFTER UPDATE ON tickets
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_ticket_event('status_changed');