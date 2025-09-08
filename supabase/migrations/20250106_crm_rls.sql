-- Row Level Security Policies for CRM
-- =====================================

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

-- Helper function to get current user's org_id from JWT
CREATE OR REPLACE FUNCTION auth.org_id() 
RETURNS uuid AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    (SELECT org_id FROM org_users WHERE user_id = auth.uid() LIMIT 1)
  )::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION auth.has_permission(required_permission text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_users 
    WHERE user_id = auth.uid() 
      AND org_id = auth.org_id()
      AND (
        role = 'admin' OR 
        permissions ? required_permission OR
        permissions->required_permission = 'true'::jsonb
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Companies policies
CREATE POLICY "Users can view companies in their org" ON companies
  FOR SELECT USING (org_id = auth.org_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create companies in their org" ON companies
  FOR INSERT WITH CHECK (org_id = auth.org_id() AND auth.has_permission('companies:write'));

CREATE POLICY "Users can update companies in their org" ON companies
  FOR UPDATE USING (org_id = auth.org_id() AND auth.has_permission('companies:write'));

CREATE POLICY "Users can soft delete companies in their org" ON companies
  FOR UPDATE USING (
    org_id = auth.org_id() AND 
    auth.has_permission('companies:delete') AND
    deleted_at IS NULL
  );

-- Contacts policies
CREATE POLICY "Users can view contacts in their org" ON contacts
  FOR SELECT USING (org_id = auth.org_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create contacts in their org" ON contacts
  FOR INSERT WITH CHECK (org_id = auth.org_id() AND auth.has_permission('contacts:write'));

CREATE POLICY "Users can update contacts in their org" ON contacts
  FOR UPDATE USING (org_id = auth.org_id() AND auth.has_permission('contacts:write'));

CREATE POLICY "Users can soft delete contacts in their org" ON contacts
  FOR UPDATE USING (
    org_id = auth.org_id() AND 
    auth.has_permission('contacts:delete') AND
    deleted_at IS NULL
  );

-- Deals policies
CREATE POLICY "Users can view deals in their org" ON deals
  FOR SELECT USING (org_id = auth.org_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create deals in their org" ON deals
  FOR INSERT WITH CHECK (org_id = auth.org_id() AND auth.has_permission('deals:write'));

CREATE POLICY "Users can update deals in their org" ON deals
  FOR UPDATE USING (org_id = auth.org_id() AND auth.has_permission('deals:write'));

CREATE POLICY "Users can soft delete deals in their org" ON deals
  FOR UPDATE USING (
    org_id = auth.org_id() AND 
    auth.has_permission('deals:delete') AND
    deleted_at IS NULL
  );

-- Tasks policies
CREATE POLICY "Users can view tasks in their org" ON tasks
  FOR SELECT USING (org_id = auth.org_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create tasks in their org" ON tasks
  FOR INSERT WITH CHECK (org_id = auth.org_id() AND auth.has_permission('tasks:write'));

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (
    org_id = auth.org_id() AND 
    (owner_id = auth.uid() OR auth.has_permission('tasks:write'))
  );

CREATE POLICY "Users can complete tasks assigned to them" ON tasks
  FOR UPDATE USING (
    org_id = auth.org_id() AND 
    owner_id = auth.uid()
  );

-- Activities policies
CREATE POLICY "Users can view activities in their org" ON activities
  FOR SELECT USING (org_id = auth.org_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create activities in their org" ON activities
  FOR INSERT WITH CHECK (org_id = auth.org_id() AND auth.has_permission('activities:write'));

CREATE POLICY "Users can update activities in their org" ON activities
  FOR UPDATE USING (org_id = auth.org_id() AND auth.has_permission('activities:write'));

-- Tickets policies
CREATE POLICY "Users can view tickets in their org" ON tickets
  FOR SELECT USING (org_id = auth.org_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create tickets in their org" ON tickets
  FOR INSERT WITH CHECK (org_id = auth.org_id() AND auth.has_permission('tickets:write'));

CREATE POLICY "Users can update tickets assigned to them" ON tickets
  FOR UPDATE USING (
    org_id = auth.org_id() AND 
    (owner_id = auth.uid() OR auth.has_permission('tickets:write'))
  );

-- Association tables policies
CREATE POLICY "Users can view company contacts in their org" ON company_contacts
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Users can manage company contacts in their org" ON company_contacts
  FOR ALL USING (org_id = auth.org_id() AND auth.has_permission('contacts:write'));

CREATE POLICY "Users can view deal contacts in their org" ON deal_contacts
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Users can manage deal contacts in their org" ON deal_contacts
  FOR ALL USING (org_id = auth.org_id() AND auth.has_permission('deals:write'));

CREATE POLICY "Users can view deal companies in their org" ON deal_companies
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Users can manage deal companies in their org" ON deal_companies
  FOR ALL USING (org_id = auth.org_id() AND auth.has_permission('deals:write'));

-- Pipelines policies
CREATE POLICY "Users can view pipelines in their org" ON pipelines
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Admins can manage pipelines" ON pipelines
  FOR ALL USING (org_id = auth.org_id() AND auth.has_permission('settings:write'));

-- Audit logs policies (read-only for most users)
CREATE POLICY "Users can view audit logs in their org" ON audit_logs
  FOR SELECT USING (org_id = auth.org_id() AND auth.has_permission('analytics:read'));

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (org_id = auth.org_id());

-- Custom field definitions policies
CREATE POLICY "Users can view custom fields in their org" ON custom_field_definitions
  FOR SELECT USING (org_id = auth.org_id());

CREATE POLICY "Admins can manage custom fields" ON custom_field_definitions
  FOR ALL USING (org_id = auth.org_id() AND auth.has_permission('settings:write'));

-- Grant necessary permissions to authenticated users
GRANT SELECT ON orgs TO authenticated;
GRANT SELECT ON org_users TO authenticated;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON contacts TO authenticated;
GRANT ALL ON deals TO authenticated;
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON activities TO authenticated;
GRANT ALL ON tickets TO authenticated;
GRANT ALL ON company_contacts TO authenticated;
GRANT ALL ON deal_contacts TO authenticated;
GRANT ALL ON deal_companies TO authenticated;
GRANT SELECT ON pipelines TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT ON custom_field_definitions TO authenticated;