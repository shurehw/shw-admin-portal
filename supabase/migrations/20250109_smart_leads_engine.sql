-- Smart Leads Engine Schema for SHW/Shureprint B2B Wholesale
-- Targets: Restaurants, Cafés, Bakeries, Hotels
-- Version: 1.0

-- Enable required extensions
create extension if not exists citext;
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm; -- For fuzzy matching

-- COMPANIES (Enhanced with Smart Leads fields)
alter table companies add column if not exists legal_name text;
alter table companies add column if not exists brand_name text;
alter table companies add column if not exists domain citext;
alter table companies add column if not exists hq_place_id text;
alter table companies add column if not exists segment text;
alter table companies add column if not exists sub_segment text;
alter table companies add column if not exists price_band text; -- $, $$, $$$
alter table companies add column if not exists location_count int default 1;
alter table companies add column if not exists tech jsonb default '{}'::jsonb; -- {pos:"Toast", res:"Resy", delivery:true}
alter table companies add column if not exists attributes jsonb default '{}'::jsonb;
alter table companies add column if not exists source_tags text[] default '{}';

-- Add indexes for companies
create index if not exists idx_companies_brand on companies using gin (to_tsvector('simple', brand_name));
create index if not exists idx_companies_segment on companies(segment, sub_segment);
create unique index if not exists idx_companies_domain on companies(domain) where domain is not null;

-- LOCATIONS (Physical locations tied to companies)
create table if not exists locations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  place_id text unique,
  name text,
  formatted_address text,
  street text, 
  city text, 
  state text, 
  postal_code text, 
  country text default 'USA',
  latitude numeric, 
  longitude numeric,
  national_phone text, 
  website text,
  opening_status text check (opening_status in ('open', 'opening_soon', 'closed', 'temporarily_closed')),
  health_grade text,
  delivery_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_locations_company on locations(company_id);
create index if not exists idx_locations_geo on locations(city, state, postal_code);
create index if not exists idx_locations_place_id on locations(place_id);

-- SIGNALS (Append-only event log)
create table if not exists signals (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('company','location','contact')),
  entity_id uuid not null,
  type text not null, -- permit, hiring, review_velocity, rar_type, etc.
  value jsonb not null,
  detected_at timestamptz not null,
  source text not null,
  confidence numeric default 0.9 check (confidence between 0 and 1),
  created_at timestamptz default now()
);

create index if not exists idx_signals_entity on signals(entity_type, entity_id);
create index if not exists idx_signals_type_time on signals(type, detected_at desc);

-- COMPANY SCORES (Latest computed scores)
create table if not exists company_scores (
  company_id uuid primary key references companies(id) on delete cascade,
  fit int default 0 check (fit between 0 and 100),
  intent int default 0 check (intent between 0 and 100),
  relationship int default 0 check (relationship between 0 and 100),
  risk int default 0,
  seasonality int default 0,
  total int default 0, -- Score (0–100+)
  winability int default 0 check (winability between 0 and 100), -- Winability (0–100)
  ev_cents bigint default 0,
  priority_band text, -- P0, P1, P2, P3
  assigned_to uuid references auth.users(id),
  assignment_date timestamptz,
  calculated_at timestamptz default now()
);

-- PROVENANCE (Track data sources)
create table if not exists provenance (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  field text not null,
  source text not null,
  collected_at timestamptz default now()
);

create index if not exists idx_provenance_entity on provenance(entity_type, entity_id);

-- IMPORT RUNS
create table if not exists import_runs (
  id uuid primary key default uuid_generate_v4(),
  source text not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  rows_ingested int default 0,
  rows_approved int default 0,
  rows_denied int default 0,
  errors jsonb default '[]'::jsonb
);

-- LEAD INTAKE (Staging/gating table)
create table if not exists lead_intake (
  id uuid primary key default uuid_generate_v4(),
  source text not null, -- RAR | manual | csv | jobs | etc.
  raw jsonb not null, -- original payload
  suggested_company jsonb,
  suggested_location jsonb,
  suggested_contacts jsonb,
  score_preview int default 0,
  winability_preview int default 0,
  status text not null default 'pending' check (status in ('pending','approved','denied','snoozed','merged','assigned')),
  reason_code text,
  notes text,
  snooze_until timestamptz,
  company_id uuid references companies(id),
  assigned_to uuid references auth.users(id),
  assignment_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lead_intake_status on lead_intake(status, created_at desc);
create index if not exists idx_lead_intake_assigned on lead_intake(assigned_to) where assigned_to is not null;

-- SUPPRESSIONS (Blacklist)
create table if not exists suppressions (
  id uuid primary key default uuid_generate_v4(),
  place_id text,
  domain citext,
  phone text,
  legal_name text,
  ig_handle text,
  reason_code text not null check (reason_code in (
    'not_icp','duplicate','out_of_territory','closed','risk',
    'vendor_locked','bad_data','test','manual_request','other'
  )),
  source text not null, -- user|system|import
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_suppressions_lookup on suppressions(place_id, domain, phone);
create index if not exists idx_suppressions_expires on suppressions(expires_at) where expires_at is not null;

-- INTAKE ACTIONS (Audit log)
create table if not exists intake_actions (
  id uuid primary key default uuid_generate_v4(),
  intake_id uuid references lead_intake(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null check (action in ('approve','deny','snooze','merge','unsuppress','assign')),
  reason_code text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- SMART LISTS (Saved queries/filters)
create table if not exists smart_lists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  filters jsonb not null, -- {geo_metros:[], segment:[], price_band:[], etc}
  sort_by text default '-total_score',
  refresh_interval text default 'P1D', -- ISO 8601 duration
  is_public boolean default false,
  created_by uuid references auth.users(id),
  last_refreshed timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_smart_lists_public on smart_lists(is_public, name);

-- LEAD ASSIGNMENTS (Track rep assignments)
create table if not exists lead_assignments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  assigned_to uuid references auth.users(id),
  assigned_by uuid references auth.users(id),
  assignment_type text check (assignment_type in ('manual','auto','round_robin','territory')),
  priority text check (priority in ('P0','P1','P2','P3')),
  due_date timestamptz,
  status text default 'active' check (status in ('active','contacted','qualified','unqualified','won','lost')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lead_assignments_rep on lead_assignments(assigned_to, status);
create index if not exists idx_lead_assignments_company on lead_assignments(company_id);

-- ENRICHMENT QUEUE
create table if not exists enrichment_queue (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  enrichment_type text not null check (enrichment_type in (
    'place_id_resolve','yelp_lite','yelp_deep','apollo_org','apollo_contacts',
    'instagram','weather','census','health_inspection','abc_license'
  )),
  priority int default 5,
  status text default 'pending' check (status in ('pending','processing','completed','failed','skipped')),
  attempts int default 0,
  last_attempt timestamptz,
  error_message text,
  created_at timestamptz default now(),
  processed_at timestamptz
);

create index if not exists idx_enrichment_queue_status on enrichment_queue(status, priority desc, created_at);

-- SCORING CONFIG (Store scoring weights)
create table if not exists scoring_configs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  is_active boolean default false,
  config jsonb not null, -- Full scoring configuration
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Ensure only one active config
create unique index if not exists idx_scoring_configs_active on scoring_configs(is_active) where is_active = true;

-- Default scoring config
insert into scoring_configs (name, is_active, config) values (
  'Default v1.0',
  true,
  '{
    "bands": { "P0": 70, "P1": 55, "P2": 40, "P3": 25, "win_A": 70, "win_B": 50 },
    "weights": { "fit": 45, "intent": 30, "relationship": 15, "risk": 1.0, "seasonality": 1.0 },
    "fit": {
      "segment_match": 10,
      "location_band": { "three_to_twenty": 10 },
      "stack_match": 10,
      "brand_signal": 5,
      "geo_in_coverage": 5,
      "capacity_proxy": 5
    },
    "intent": {
      "rar_pre_open": 12,
      "rar_ownership_change": 9,
      "rar_remodel_or_reloc": 6,
      "jobs_gm_execchef": 6,
      "review_velocity_up": 6
    },
    "relationship": { 
      "past_buyer": 8, 
      "warm_path": 7 
    },
    "risk": { 
      "low_health_grade": -8, 
      "credit_late_pay": -7 
    },
    "seasonality": { 
      "hot_week_beverage": 10, 
      "cold_week_soup_bakery": 6 
    },
    "winability": {
      "warm_path": 25,
      "dm_verified": 15,
      "lookalike_top100": 20,
      "terms_feasible": 10,
      "ops_complexity_favorable": 10,
      "engagement_signals": 10,
      "blockers_procurement_locked": -20,
      "blockers_no_response": -10,
      "blockers_high_risk": -10
    },
    "acv_defaults": {
      "restaurant": 6500,
      "cafe": 4200,
      "bakery": 3800,
      "hotel": 12000
    }
  }'::jsonb
) on conflict do nothing;

-- Functions for lead management
create or replace function assign_lead_round_robin(p_company_id uuid)
returns uuid as $$
declare
  v_assigned_to uuid;
begin
  -- Get the sales rep with fewest active assignments
  select u.id into v_assigned_to
  from auth.users u
  left join user_profiles up on u.id = up.user_id
  left join (
    select assigned_to, count(*) as active_count
    from lead_assignments
    where status = 'active'
    group by assigned_to
  ) la on u.id = la.assigned_to
  where up.role in ('sales_rep', 'admin')
  order by coalesce(la.active_count, 0) asc
  limit 1;
  
  -- Create assignment
  if v_assigned_to is not null then
    insert into lead_assignments (
      company_id, assigned_to, assignment_type, priority
    ) values (
      p_company_id, v_assigned_to, 'round_robin', 'P2'
    );
  end if;
  
  return v_assigned_to;
end;
$$ language plpgsql;

-- Trigger to update timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_companies_updated_at before update on companies
  for each row execute function update_updated_at();
  
create trigger update_locations_updated_at before update on locations
  for each row execute function update_updated_at();
  
create trigger update_lead_intake_updated_at before update on lead_intake
  for each row execute function update_updated_at();
  
create trigger update_smart_lists_updated_at before update on smart_lists
  for each row execute function update_updated_at();
  
create trigger update_lead_assignments_updated_at before update on lead_assignments
  for each row execute function update_updated_at();