-- Run this once on your Railway PostgreSQL database to initialise the schema.
-- You can run it via the Railway shell: psql $DATABASE_URL -f migrate.sql

CREATE TABLE IF NOT EXISTS leads (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  source        TEXT,           -- e.g. '6-week-hero', 'pt-modal', 'main-contact'
  survey_q1     TEXT,           -- survey answer step 1
  survey_q2     TEXT,           -- survey answer step 2
  ghl_contact_id TEXT,          -- GHL contact ID returned after push
  ghl_status    TEXT DEFAULT 'pending',  -- 'success' | 'failed' | 'pending'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_events (
  id            SERIAL PRIMARY KEY,
  session_id    TEXT,
  page          TEXT,           -- URL path / page name
  event_type    TEXT NOT NULL,  -- 'pageview', 'scroll_25', 'scroll_50', 'scroll_75', 'scroll_100',
                                -- 'form_start', 'form_submit', 'survey_step'
  event_data    JSONB,          -- arbitrary extra data
  user_agent    TEXT,
  ip            TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at    ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_source        ON leads(source);
CREATE INDEX IF NOT EXISTS idx_page_events_page    ON page_events(page);
CREATE INDEX IF NOT EXISTS idx_page_events_type    ON page_events(event_type);
CREATE INDEX IF NOT EXISTS idx_page_events_session ON page_events(session_id);
