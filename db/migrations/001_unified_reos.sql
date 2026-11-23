CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  custom_domain TEXT UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'starter',
  white_label_config JSONB NOT NULL DEFAULT '{}',
  credit_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  apn TEXT,
  fips_code TEXT,
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  zip_code VARCHAR(10),
  geom GEOMETRY(Point, 4326),
  property_type TEXT NOT NULL,
  beds NUMERIC(4,1), baths NUMERIC(4,1), sqft INTEGER, lot_sqft INTEGER,
  year_built INTEGER, owner_name TEXT,
  mortgage_data JSONB NOT NULL DEFAULT '{}',
  tax_assessment JSONB NOT NULL DEFAULT '{}',
  raw_payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX properties_geom_idx ON properties USING GIST (geom);

CREATE TABLE deal_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source_channel TEXT NOT NULL, source_external_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', asking_price NUMERIC(14,2),
  auction_date TIMESTAMPTZ, media_urls JSONB NOT NULL DEFAULT '[]',
  propensity_scores JSONB NOT NULL DEFAULT '{}', raw_payload JSONB NOT NULL DEFAULT '{}',
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id),
  property_id UUID NOT NULL REFERENCES properties(id), listing_id UUID REFERENCES deal_listings(id),
  lifecycle_stage TEXT NOT NULL DEFAULT 'SOURCED', temporal_workflow_id TEXT UNIQUE,
  recommended_strategy TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE underwriting_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  strategy_type TEXT NOT NULL, purchase_price NUMERIC(14,2) NOT NULL,
  arv_estimate NUMERIC(14,2) NOT NULL, rehab_line_items JSONB NOT NULL DEFAULT '[]',
  total_rehab_cost NUMERIC(14,2) NOT NULL DEFAULT 0, closing_costs NUMERIC(14,2) NOT NULL DEFAULT 0,
  holding_costs_monthly NUMERIC(12,2) NOT NULL DEFAULT 0, estimated_rent_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
  creative_terms JSONB NOT NULL DEFAULT '{}', outputs JSONB NOT NULL DEFAULT '{}',
  engine_version TEXT NOT NULL DEFAULT '1.0.0', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contracts_and_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id),
  deal_id UUID NOT NULL REFERENCES deals(id), scenario_id UUID NOT NULL REFERENCES underwriting_scenarios(id),
  contract_type TEXT NOT NULL, offer_amount NUMERIC(14,2) NOT NULL,
  inspection_period_days INTEGER NOT NULL DEFAULT 10, closing_date DATE,
  esign_envelope_id TEXT, esign_status TEXT NOT NULL DEFAULT 'DRAFT',
  approval_id TEXT, document_storage_url TEXT, executed_at TIMESTAMPTZ
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID REFERENCES tenants(id),
  company_name TEXT NOT NULL, trade_category TEXT NOT NULL, service_zip_codes TEXT[] NOT NULL DEFAULT '{}',
  contact_email TEXT, contact_phone TEXT, license_number TEXT,
  insurance_verified BOOLEAN NOT NULL DEFAULT false, rating NUMERIC(3,2) DEFAULT 5
);

CREATE TABLE rfq_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id),
  deal_id UUID NOT NULL REFERENCES deals(id), trade_category TEXT NOT NULL,
  scope_of_work JSONB NOT NULL DEFAULT '[]', due_date TIMESTAMPTZ, status TEXT NOT NULL DEFAULT 'OPEN'
);

CREATE TABLE rfq_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), rfq_id UUID NOT NULL REFERENCES rfq_requests(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id), bid_amount NUMERIC(14,2) NOT NULL,
  estimated_days INTEGER, normalized_line_items JSONB NOT NULL DEFAULT '[]',
  raw_bid_pdf_url TEXT, is_awarded BOOLEAN NOT NULL DEFAULT false, submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE closing_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id),
  deal_id UUID UNIQUE NOT NULL REFERENCES deals(id), title_commitment_audit JSONB NOT NULL DEFAULT '{}',
  alta_settlement_audit JSONB NOT NULL DEFAULT '{}', insurance_policy_bound BOOLEAN NOT NULL DEFAULT false,
  ron_session_url TEXT, wire_verified BOOLEAN NOT NULL DEFAULT false, closed_at TIMESTAMPTZ
);

CREATE TABLE rehab_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id),
  deal_id UUID NOT NULL REFERENCES deals(id), vendor_id UUID REFERENCES vendors(id),
  milestone_name TEXT NOT NULL, draw_amount NUMERIC(12,2) NOT NULL,
  verification_photo_urls JSONB NOT NULL DEFAULT '[]', vision_verified BOOLEAN NOT NULL DEFAULT false,
  user_approved BOOLEAN NOT NULL DEFAULT false, paid_at TIMESTAMPTZ
);

CREATE TABLE leases_and_pm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id),
  deal_id UUID NOT NULL REFERENCES deals(id), tenant_full_name TEXT, tenant_email TEXT,
  monthly_rent NUMERIC(10,2), lease_start DATE, lease_end DATE,
  stripe_ach_mandate_id TEXT, status TEXT NOT NULL DEFAULT 'MARKETING'
);

CREATE TABLE pm_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES tenants(id),
  deal_id UUID NOT NULL REFERENCES deals(id), entry_type TEXT NOT NULL,
  schedule_e_category TEXT NOT NULL, amount NUMERIC(12,2) NOT NULL,
  occurred_on DATE NOT NULL, memo TEXT
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID REFERENCES tenants(id), deal_id UUID REFERENCES deals(id),
  doc_type TEXT NOT NULL, page_number INTEGER, content TEXT NOT NULL, source_url TEXT,
  embedding VECTOR(1536)
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE underwriting_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts_and_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehab_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases_and_pm ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY tenant_properties ON properties USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_deal_listings ON deal_listings USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_deals ON deals USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_underwriting ON underwriting_scenarios USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_contracts ON contracts_and_offers USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_rfq_requests ON rfq_requests USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_closing ON closing_checklists USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_rehab ON rehab_milestones USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_leases ON leases_and_pm USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_ledger ON pm_ledger_entries USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
CREATE POLICY tenant_documents ON document_chunks USING (tenant_id::text = current_setting('request.jwt.claim.tenant_id', true));
