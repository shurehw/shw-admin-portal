// Core CRM Types
export interface BaseEntity {
  id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  owner_id?: string | null;
  custom?: Record<string, any>;
}

export interface Contact extends BaseEntity {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  title?: string | null;
  company_id?: string | null;
  lifecycle_stage?: string;
  search_vector?: any;
  // Computed
  full_name?: string;
  company?: Company;
  deals?: Deal[];
  activities?: Activity[];
  tasks?: Task[];
}

export interface Company extends BaseEntity {
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  website?: string | null;
  description?: string | null;
  search_vector?: any;
  // Computed
  contacts?: Contact[];
  deals?: Deal[];
  contact_count?: number;
  deal_count?: number;
  total_revenue?: number;
}

export interface Deal extends BaseEntity {
  name: string;
  amount?: number | null;
  stage: string;
  pipeline_id?: string | null;
  probability?: number;
  expected_close_date?: string | null;
  close_date?: string | null;
  contact_id?: string | null;
  company_id?: string | null;
  description?: string | null;
  // Computed
  contact?: Contact;
  company?: Company;
  participants?: DealParticipant[];
  activities?: Activity[];
  tasks?: Task[];
}

export interface Task extends BaseEntity {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  contact_id?: string | null;
  company_id?: string | null;
  deal_id?: string | null;
  assigned_to?: string | null;
  // Computed
  contact?: Contact;
  company?: Company;
  deal?: Deal;
  assignee?: User;
}

export interface Activity extends BaseEntity {
  type: 'call' | 'email_in' | 'email_out' | 'meeting' | 'note' | 'sms_in' | 'sms_out' | 'task';
  subject?: string | null;
  description?: string | null;
  contact_id?: string | null;
  company_id?: string | null;
  deal_id?: string | null;
  direction?: 'in' | 'out' | null;
  via?: string | null;
  external_id?: string | null;
  thread_id?: string | null;
  metadata?: Record<string, any>;
  // Computed
  contact?: Contact;
  company?: Company;
  deal?: Deal;
  creator?: User;
}

export interface Ticket extends BaseEntity {
  subject: string;
  description?: string | null;
  status: 'new' | 'open' | 'pending' | 'solved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  company_id?: string | null;
  contact_id?: string | null;
  assigned_to?: string | null;
  sla_due?: string | null;
  // Computed
  contact?: Contact;
  company?: Company;
  assignee?: User;
}

export interface Pipeline {
  id: string;
  org_id: string;
  name: string;
  stages: PipelineStage[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  key: string;
  label: string;
  order: number;
  probability?: number;
  color?: string;
}

export interface DealParticipant {
  id: string;
  deal_id: string;
  contact_id: string;
  role?: string;
  is_influencer?: boolean;
  contact?: Contact;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role?: string;
}

export interface Automation {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  trigger_type: 'record.created' | 'record.updated' | 'record.deleted' | 'time.schedule' | 'webhook';
  trigger_entity?: string;
  trigger_conditions?: any;
  filters?: any;
  actions: AutomationAction[];
  is_active: boolean;
  last_run_at?: string;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationAction {
  type: 'create_task' | 'update_field' | 'send_email' | 'webhook' | 'create_activity';
  config: Record<string, any>;
}

export interface List {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  entity_type: 'contacts' | 'companies' | 'deals';
  filters: any;
  is_dynamic: boolean;
  member_count: number;
  last_updated?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  org_id: string;
  name: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  variables?: Record<string, any>;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Filter and Query Types
export interface QueryFilters {
  q?: string; // Search query
  owner_id?: string;
  stage?: string;
  status?: string;
  priority?: string;
  lifecycle_stage?: string;
  pipeline_id?: string;
  company_id?: string;
  contact_id?: string;
  deal_id?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  include_deleted?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Audit Types
export interface AuditLog {
  id: string;
  org_id: string;
  user_id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

// Custom Field Types
export interface CustomFieldDefinition {
  id: string;
  org_id: string;
  entity_type: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'url' | 'email';
  options?: string[];
  is_required: boolean;
  is_unique: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Metrics Types
export interface DealMetrics {
  total_value: number;
  average_value: number;
  count: number;
  won_count: number;
  lost_count: number;
  win_rate: number;
  average_cycle_days: number;
}

export interface ActivityMetrics {
  calls_made: number;
  emails_sent: number;
  meetings_held: number;
  tasks_completed: number;
  deals_created: number;
  deals_closed: number;
  revenue_generated: number;
}

// Permission Types
export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete';
  granted: boolean;
}

export interface Role {
  name: string;
  permissions: Record<string, boolean>;
}