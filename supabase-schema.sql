-- Supabase SQL Schema for Hospitality CRM
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VENUES TABLE (Bars, Restaurants, Cafes, etc.)
-- =====================================================
CREATE TABLE venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('bar', 'restaurant', 'nightclub', 'lounge', 'sports_bar', 'brewery', 'winery', 'cafe', 'catering', 'food_truck', 'hotel_bar', 'event_space')),
  
  -- Location
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  neighborhood VARCHAR(100),
  
  -- Contact Info
  phone VARCHAR(30),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Business Details
  capacity INTEGER,
  square_footage INTEGER,
  established_year INTEGER,
  business_hours JSONB,
  
  -- Liquor License
  liquor_license_type VARCHAR(50),
  liquor_license_status VARCHAR(50),
  liquor_license_number VARCHAR(100),
  liquor_license_expiry DATE,
  
  -- Financial
  annual_revenue VARCHAR(50),
  alcohol_sales_percentage INTEGER,
  avg_check_size DECIMAL(10, 2),
  
  -- Decision Makers
  decision_maker_name VARCHAR(255),
  decision_maker_title VARCHAR(100),
  decision_maker_email VARCHAR(255),
  decision_maker_phone VARCHAR(30),
  
  -- CRM Status
  status VARCHAR(50) DEFAULT 'prospect' CHECK (status IN ('prospect', 'contacted', 'qualified', 'customer', 'closed_lost')),
  opportunity_score INTEGER DEFAULT 0 CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  last_contact TIMESTAMP,
  next_followup DATE,
  
  -- Metadata
  source VARCHAR(100),
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  
  -- RAR Integration
  rar_id VARCHAR(100),
  rar_last_sync TIMESTAMP,
  rar_activity_type VARCHAR(100),
  rar_activity_date DATE
);

-- Create indexes for performance
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_state ON venues(state);
CREATE INDEX idx_venues_type ON venues(type);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_opportunity_score ON venues(opportunity_score DESC);
CREATE INDEX idx_venues_created_at ON venues(created_at DESC);

-- =====================================================
-- CONTACTS TABLE
-- =====================================================
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(30),
  mobile VARCHAR(30),
  
  -- Professional Info
  title VARCHAR(100),
  department VARCHAR(100),
  company VARCHAR(255),
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  
  -- Contact Preferences
  preferred_contact_method VARCHAR(50),
  best_time_to_contact VARCHAR(100),
  
  -- Social Media
  linkedin_url VARCHAR(255),
  twitter_handle VARCHAR(100),
  instagram_handle VARCHAR(100),
  
  -- CRM Fields
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  lead_score INTEGER DEFAULT 0,
  last_contact TIMESTAMP,
  birthday DATE,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID
);

CREATE INDEX idx_contacts_venue_id ON contacts(venue_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);

-- =====================================================
-- DEALS TABLE
-- =====================================================
CREATE TABLE deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  value DECIMAL(12, 2),
  
  -- Pipeline Stage
  stage VARCHAR(50) DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  
  -- Relationships
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Deal Details
  product_category VARCHAR(100),
  expected_close_date DATE,
  actual_close_date DATE,
  close_reason TEXT,
  competitors TEXT[],
  
  -- Financial
  monthly_recurring_revenue DECIMAL(10, 2),
  contract_length_months INTEGER,
  payment_terms VARCHAR(100),
  
  -- Metadata
  description TEXT,
  next_step TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  assigned_to UUID
);

CREATE INDEX idx_deals_venue_id ON deals(venue_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_expected_close_date ON deals(expected_close_date);

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================
CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task', 'check_in')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Relationships
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  
  -- Activity Details
  outcome VARCHAR(100),
  duration_minutes INTEGER,
  location VARCHAR(255),
  
  -- Check-in specific
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_in_address VARCHAR(255),
  
  -- Scheduling
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  reminder_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  assigned_to UUID
);

CREATE INDEX idx_activities_venue_id ON activities(venue_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_deal_id ON activities(deal_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_scheduled_at ON activities(scheduled_at);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- =====================================================
-- TASKS TABLE
-- =====================================================
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Task Details
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Relationships
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  
  -- Scheduling
  due_date DATE,
  completed_at TIMESTAMP,
  reminder_at TIMESTAMP,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50),
  recurrence_end_date DATE,
  
  -- Metadata
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  assigned_to UUID
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- =====================================================
-- EMAIL_TRACKING TABLE
-- =====================================================
CREATE TABLE email_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Email Details
  subject VARCHAR(500),
  from_email VARCHAR(255),
  to_emails TEXT[],
  cc_emails TEXT[],
  body TEXT,
  
  -- Relationships
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  
  -- Tracking
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  replied_at TIMESTAMP,
  bounced_at TIMESTAMP,
  
  -- Metrics
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Metadata
  email_provider VARCHAR(50),
  campaign_id VARCHAR(100),
  template_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_email_tracking_venue_id ON email_tracking(venue_id);
CREATE INDEX idx_email_tracking_contact_id ON email_tracking(contact_id);
CREATE INDEX idx_email_tracking_sent_at ON email_tracking(sent_at DESC);

-- =====================================================
-- LISTS TABLE (Target Lists)
-- =====================================================
CREATE TABLE lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- List Configuration
  type VARCHAR(50) DEFAULT 'static' CHECK (type IN ('static', 'dynamic')),
  filters JSONB,
  
  -- Stats
  total_venues INTEGER DEFAULT 0,
  total_contacts INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  shared_with UUID[]
);

-- =====================================================
-- LIST_MEMBERS TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE list_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  added_by UUID,
  
  UNIQUE(list_id, venue_id),
  UNIQUE(list_id, contact_id)
);

CREATE INDEX idx_list_members_list_id ON list_members(list_id);
CREATE INDEX idx_list_members_venue_id ON list_members(venue_id);
CREATE INDEX idx_list_members_contact_id ON list_members(contact_id);

-- =====================================================
-- AUTOMATIONS TABLE
-- =====================================================
CREATE TABLE automations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Automation Configuration
  trigger_type VARCHAR(100),
  trigger_conditions JSONB,
  actions JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID
);

-- =====================================================
-- SETTINGS TABLE
-- =====================================================
CREATE TABLE settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB,
  category VARCHAR(100),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_by UUID
);

-- Insert default settings
INSERT INTO settings (key, value, category, description) VALUES
  ('rar_sync', '{"enabled": false, "last_sync": null, "auto_sync": false}', 'integration', 'RAR sync configuration'),
  ('email_tracking', '{"enabled": true, "provider": "sendgrid"}', 'email', 'Email tracking configuration'),
  ('default_pipeline', '{"stages": ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]}', 'sales', 'Default sales pipeline');

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- For now, allow all authenticated users full access
CREATE POLICY "Allow all for authenticated users" ON venues FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON deals FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON activities FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON email_tracking FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON lists FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON list_members FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON automations FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON settings FOR ALL USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - Remove for production)
-- =====================================================
INSERT INTO venues (name, type, address, city, state, zip_code, phone, email, capacity, liquor_license_type, liquor_license_status, annual_revenue, alcohol_sales_percentage, decision_maker_name, decision_maker_title, status, opportunity_score) VALUES
  ('Tony''s Italian Kitchen', 'restaurant', '123 Main St', 'Boston', 'MA', '02101', '(617) 555-0123', 'info@tonysitalian.com', 120, 'full', 'active', '$1M-$2M', 35, 'Tony Marino', 'Owner', 'prospect', 85),
  ('The Dive Bar', 'bar', '456 Oak Ave', 'Miami', 'FL', '33101', '(305) 555-0456', 'manager@divebar.com', 80, 'full', 'active', '$500K-$1M', 75, 'Sarah Johnson', 'Manager', 'contacted', 72),
  ('Sunrise Coffee Co', 'cafe', '789 Coffee Blvd', 'Seattle', 'WA', '98101', '(206) 555-0789', 'hello@sunrisecoffee.com', 45, 'beer_wine', 'pending', '$200K-$500K', 15, 'Mike Chen', 'Owner', 'qualified', 68),
  ('Club Midnight', 'nightclub', '321 Party St', 'Las Vegas', 'NV', '89101', '(702) 555-0321', 'info@clubmidnight.com', 500, 'full', 'active', '$5M-$10M', 85, 'Jessica Lee', 'General Manager', 'customer', 95),
  ('Craft Brew House', 'brewery', '555 Hop Lane', 'Portland', 'OR', '97201', '(503) 555-0555', 'brew@craftbrewhouse.com', 150, 'brewery', 'active', '$2M-$5M', 90, 'Tom Wilson', 'Brewmaster', 'prospect', 88);

-- Grant permissions (adjust for your specific setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;