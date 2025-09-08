-- Simplified Row Level Security Policies for CRM
-- ===============================================
-- This version works with standard Supabase permissions

-- Enable RLS on all tables
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deal_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS org_users ENABLE ROW LEVEL SECURITY;

-- Simple policies that allow access for authenticated users
-- In production, you would make these more restrictive based on org_id

-- Companies policies
CREATE POLICY "Authenticated users can view companies" ON companies
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update companies" ON companies
  FOR UPDATE USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can delete companies" ON companies
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Contacts policies
CREATE POLICY "Authenticated users can view contacts" ON contacts
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contacts" ON contacts
  FOR UPDATE USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can delete contacts" ON contacts
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Deals policies
CREATE POLICY "Authenticated users can view deals" ON deals
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create deals" ON deals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update deals" ON deals
  FOR UPDATE USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can delete deals" ON deals
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Tasks policies
CREATE POLICY "Authenticated users can view tasks" ON tasks
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tasks" ON tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can delete tasks" ON tasks
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Activities policies
CREATE POLICY "Authenticated users can view activities" ON activities
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update activities" ON activities
  FOR UPDATE USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can delete activities" ON activities
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Tickets policies
CREATE POLICY "Authenticated users can view tickets" ON tickets
  FOR SELECT USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tickets" ON tickets
  FOR UPDATE USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can delete tickets" ON tickets
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Pipelines policies
CREATE POLICY "Authenticated users can view pipelines" ON pipelines
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create pipelines" ON pipelines
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pipelines" ON pipelines
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pipelines" ON pipelines
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Association tables policies
CREATE POLICY "Authenticated users can view company_contacts" ON company_contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create company_contacts" ON company_contacts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete company_contacts" ON company_contacts
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view deal_contacts" ON deal_contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create deal_contacts" ON deal_contacts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete deal_contacts" ON deal_contacts
  FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view deal_companies" ON deal_companies
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create deal_companies" ON deal_companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete deal_companies" ON deal_companies
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Audit logs policies (read-only for most users)
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true); -- Allow system to create audit logs

-- Custom field definitions policies
CREATE POLICY "Authenticated users can view custom field definitions" ON custom_field_definitions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create custom field definitions" ON custom_field_definitions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update custom field definitions" ON custom_field_definitions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete custom field definitions" ON custom_field_definitions
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Organization policies
CREATE POLICY "Authenticated users can view orgs" ON orgs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update orgs" ON orgs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Org users policies
CREATE POLICY "Authenticated users can view org_users" ON org_users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create org_users" ON org_users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update org_users" ON org_users
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete org_users" ON org_users
  FOR DELETE USING (auth.uid() IS NOT NULL);