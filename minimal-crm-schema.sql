-- Minimal CRM Schema with Dynamic Properties
-- Core entities: CONTACT and COMPANY with custom properties system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =====================================================
-- CORE ENTITIES
-- =====================================================

-- COMPANIES table
CREATE TABLE companies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  domain citext UNIQUE, -- nullable if no website
  phone text,
  address text,
  address2 text,
  city text,
  state text,
  zip text,
  country text,
  industry text,
  owner_id uuid, -- FK to users(id) when user system exists
  
  -- Lifecycle management
  lifecycle_stage text DEFAULT 'Prospect' CHECK (lifecycle_stage IN ('Prospect', 'Customer', 'Former')),
  parent_company_id uuid REFERENCES companies(id),
  territory text,
  account_tier text CHECK (account_tier IN ('A', 'B', 'C')),
  location_count integer,
  
  -- External system integration
  netsuite_customer_id text,
  portal_company_id text,
  
  -- Commerce settings
  price_list text,
  payment_terms text CHECK (payment_terms IN ('COD', 'Net 15', 'Net 30', 'CC on file')),
  credit_limit numeric(12,2),
  credit_status text CHECK (credit_status IN ('Good', 'Review', 'Hold')),
  tax_exempt boolean,
  resale_cert_expiry date,
  
  -- Logistics
  receiving_notes text,
  default_warehouse text,
  default_route text,
  
  -- Analytics (read-only/sync fields)
  last_order_date date,
  t12m_revenue numeric(14,2),
  open_quote_count integer DEFAULT 0,
  open_ticket_count integer DEFAULT 0,
  
  -- Custom properties (flexible storage)
  props jsonb NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CONTACTS table
CREATE TABLE contacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email citext NOT NULL UNIQUE,
  first_name text,
  last_name text,
  job_title text,
  mobile_phone text,
  phone text,
  owner_id uuid, -- FK to users(id) when user system exists
  
  -- Lifecycle management
  lifecycle_stage text DEFAULT 'Lead' CHECK (lifecycle_stage IN ('Subscriber', 'Lead', 'MQL', 'SQL', 'Customer', 'Former')),
  lead_status text CHECK (lead_status IN ('New', 'Attempted', 'Connected', 'Qualified', 'Unqualified')),
  
  -- Next steps
  next_step text,
  next_step_due date,
  
  -- Communication preferences
  preferred_channel text CHECK (preferred_channel IN ('Call', 'SMS', 'Email', 'WhatsApp')),
  time_zone text, -- IANA timezone string
  
  -- Marketing & analytics
  tags text[] DEFAULT '{}',
  utm_source text,
  utm_medium text,
  analytics_source text,
  
  -- Company association
  company_id uuid REFERENCES companies(id),
  
  -- Custom properties (flexible storage)
  props jsonb NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SUPPORTING TABLES
-- =====================================================

-- Company domains (for multi-brand companies)
CREATE TABLE company_domains (
  domain citext PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

-- Blocked domains (personal email providers to ignore for auto-association)
CREATE TABLE blocked_domains (
  domain citext PRIMARY KEY
);

-- Field definitions for dynamic forms
CREATE TABLE field_definitions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity text NOT NULL CHECK (entity IN ('contact', 'company')),
  key text NOT NULL, -- machine name
  label text NOT NULL, -- display label
  type text NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'date', 'datetime', 'email', 'phone', 'url', 'enum', 'multiselect', 'json')),
  required boolean DEFAULT false,
  unique boolean DEFAULT false,
  "group" text, -- UI section grouping
  "order" integer DEFAULT 0,
  help_text text,
  options jsonb, -- for enum/multiselect: { "values": ["A", "B"] }
  default_value jsonb,
  visible boolean DEFAULT true,
  editable boolean DEFAULT true,
  system boolean DEFAULT false, -- core fields cannot be deleted
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(entity, key)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Companies indexes
CREATE INDEX idx_companies_owner_id ON companies(owner_id);
CREATE INDEX idx_companies_lifecycle_stage ON companies(lifecycle_stage, account_tier, territory);
CREATE INDEX idx_companies_parent ON companies(parent_company_id);

-- Contacts indexes  
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX idx_contacts_lifecycle_stage ON contacts(lifecycle_stage, lead_status);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Supporting table indexes
CREATE INDEX idx_company_domains_company_id ON company_domains(company_id);
CREATE INDEX idx_field_definitions_entity_order ON field_definitions(entity, "order");

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed blocked domains (personal email providers)
INSERT INTO blocked_domains (domain) VALUES 
('gmail.com'), ('yahoo.com'), ('hotmail.com'), ('outlook.com'), 
('icloud.com'), ('aol.com'), ('live.com'), ('msn.com'), 
('me.com'), ('ymail.com'), ('gmx.com'), ('proton.me'), ('mail.ru');

-- Seed system field definitions for CONTACT
INSERT INTO field_definitions (entity, key, label, type, required, "group", "order", system) VALUES
('contact', 'email', 'Email Address', 'email', true, 'General', 10, true),
('contact', 'first_name', 'First Name', 'text', false, 'General', 20, true),
('contact', 'last_name', 'Last Name', 'text', false, 'General', 30, true),
('contact', 'job_title', 'Job Title', 'text', false, 'General', 40, true),
('contact', 'phone', 'Phone', 'phone', false, 'General', 50, true),
('contact', 'mobile_phone', 'Mobile Phone', 'phone', false, 'General', 60, true),
('contact', 'lifecycle_stage', 'Lifecycle Stage', 'enum', false, 'Status', 100, true),
('contact', 'lead_status', 'Lead Status', 'enum', false, 'Status', 110, true),
('contact', 'next_step', 'Next Step', 'text', false, 'Next Steps', 200, true),
('contact', 'next_step_due', 'Next Step Due', 'date', false, 'Next Steps', 210, true),
('contact', 'preferred_channel', 'Preferred Channel', 'enum', false, 'Preferences', 300, true),
('contact', 'time_zone', 'Time Zone', 'text', false, 'Preferences', 310, true),
('contact', 'tags', 'Tags', 'multiselect', false, 'Tags', 400, true);

-- Seed system field definitions for COMPANY  
INSERT INTO field_definitions (entity, key, label, type, required, "group", "order", system) VALUES
('company', 'name', 'Company Name', 'text', true, 'General', 10, true),
('company', 'domain', 'Website Domain', 'url', false, 'General', 20, true),
('company', 'phone', 'Phone', 'phone', false, 'General', 30, true),
('company', 'address', 'Address', 'text', false, 'General', 40, true),
('company', 'city', 'City', 'text', false, 'General', 50, true),
('company', 'state', 'State', 'text', false, 'General', 60, true),
('company', 'zip', 'ZIP Code', 'text', false, 'General', 70, true),
('company', 'country', 'Country', 'text', false, 'General', 80, true),
('company', 'industry', 'Industry', 'text', false, 'General', 90, true),
('company', 'lifecycle_stage', 'Lifecycle Stage', 'enum', false, 'Status', 100, true),
('company', 'account_tier', 'Account Tier', 'enum', false, 'Status', 110, true),
('company', 'territory', 'Territory', 'text', false, 'Status', 120, true),
('company', 'price_list', 'Price List', 'text', false, 'Commerce', 200, true),
('company', 'payment_terms', 'Payment Terms', 'enum', false, 'Commerce', 210, true),
('company', 'credit_limit', 'Credit Limit', 'number', false, 'Commerce', 220, true),
('company', 'credit_status', 'Credit Status', 'enum', false, 'Commerce', 230, true);

-- Update field options for enum fields
UPDATE field_definitions SET options = '{"values": ["Subscriber", "Lead", "MQL", "SQL", "Customer", "Former"]}'
WHERE entity = 'contact' AND key = 'lifecycle_stage';

UPDATE field_definitions SET options = '{"values": ["New", "Attempted", "Connected", "Qualified", "Unqualified"]}'  
WHERE entity = 'contact' AND key = 'lead_status';

UPDATE field_definitions SET options = '{"values": ["Call", "SMS", "Email", "WhatsApp"]}'
WHERE entity = 'contact' AND key = 'preferred_channel';

UPDATE field_definitions SET options = '{"values": ["Prospect", "Customer", "Former"]}'
WHERE entity = 'company' AND key = 'lifecycle_stage';

UPDATE field_definitions SET options = '{"values": ["A", "B", "C"]}'
WHERE entity = 'company' AND key = 'account_tier';

UPDATE field_definitions SET options = '{"values": ["COD", "Net 15", "Net 30", "CC on file"]}'
WHERE entity = 'company' AND key = 'payment_terms';

UPDATE field_definitions SET options = '{"values": ["Good", "Review", "Hold"]}'
WHERE entity = 'company' AND key = 'credit_status';

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_definitions_updated_at BEFORE UPDATE ON field_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Contact → Company auto-association by email domain
CREATE OR REPLACE FUNCTION auto_associate_contact_to_company()
RETURNS TRIGGER AS $$
DECLARE
  email_domain text;
  company_record record;
  new_company_id uuid;
BEGIN
  -- Extract domain from email
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;
  
  email_domain := lower(split_part(NEW.email, '@', 2));
  
  -- Skip if domain is blocked (personal email provider)
  IF EXISTS (SELECT 1 FROM blocked_domains WHERE domain = email_domain) THEN
    RETURN NEW;
  END IF;
  
  -- Try to find existing company by domain
  SELECT id INTO new_company_id FROM companies WHERE domain = email_domain;
  
  -- If not found, try company_domains table
  IF new_company_id IS NULL THEN
    SELECT c.id INTO new_company_id 
    FROM companies c 
    JOIN company_domains cd ON c.id = cd.company_id 
    WHERE cd.domain = email_domain;
  END IF;
  
  -- If still not found, create new company
  IF new_company_id IS NULL THEN
    INSERT INTO companies (name, domain) 
    VALUES (
      initcap(split_part(email_domain, '.', 1)), -- TitleCase first part of domain
      email_domain
    ) 
    RETURNING id INTO new_company_id;
  END IF;
  
  -- Associate contact with company
  NEW.company_id := new_company_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_associate_contact_to_company
  BEFORE INSERT OR UPDATE OF email ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION auto_associate_contact_to_company();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Sample companies
INSERT INTO companies (name, domain, phone, city, state, industry, lifecycle_stage, account_tier) VALUES
('Acme Restaurant Group', 'acme.com', '(555) 123-4567', 'New York', 'NY', 'Food & Beverage', 'Customer', 'A'),
('Bella Vista Holdings', 'bellavista.com', '(555) 234-5678', 'Los Angeles', 'CA', 'Hospitality', 'Prospect', 'B'),
('Metro Bar Company', 'metrobar.com', '(555) 345-6789', 'Chicago', 'IL', 'Food & Beverage', 'Customer', 'A');

-- Sample contacts (will auto-associate to companies via trigger)
INSERT INTO contacts (email, first_name, last_name, job_title, phone, lifecycle_stage, lead_status) VALUES
('john.smith@acme.com', 'John', 'Smith', 'General Manager', '(555) 123-1111', 'Customer', 'Qualified'),
('sarah.jones@bellavista.com', 'Sarah', 'Jones', 'Purchasing Manager', '(555) 234-2222', 'Lead', 'Connected'),
('mike.wilson@metrobar.com', 'Mike', 'Wilson', 'Owner', '(555) 345-3333', 'Customer', 'Qualified'),
('lisa.brown@acme.com', 'Lisa', 'Brown', 'Operations Director', '(555) 123-4444', 'Customer', 'Qualified');