-- =============================================================================
-- MOSHLY APPS — RLS BASELINE MIGRATION
-- Apps: Quote · MerchPad · Run  |  Auth: Supabase Auth (auth.uid())
-- Policy model: owner-only — each user reads/writes only their own rows
-- =============================================================================
-- HOW TO USE
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire file and click Run
--   3. Run the TEST COMMANDS section at the bottom to verify
-- =============================================================================
-- ⚠️  ASSUMPTIONS — adjust if your schema differs:
--   • Direct-owner tables carry a  user_id uuid  column = auth.uid()
--   • users table uses              id uuid        column = auth.uid()
--   • Child tables reference parent via FK (e.g. quote_id, product_id, tour_id)
--   • audit_log is append-only from server; clients get read-only access
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- STEP 1 — ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ---------------------------------------------------------------------------

-- Shared
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log      ENABLE ROW LEVEL SECURITY;

-- Quote app
ALTER TABLE public.quotes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_versions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_negotiations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues              ENABLE ROW LEVEL SECURITY;

-- MerchPad app
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs  ENABLE ROW LEVEL SECURITY;

-- Run app
ALTER TABLE public.tours           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backline_riders ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- STEP 2 — DROP ANY EXISTING POLICIES (idempotent re-run safety)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'users','user_profiles','audit_log',
        'quotes','quote_versions','quote_negotiations','artists','venues',
        'products','variants','sales','orders','inventory_logs',
        'tours','shows','schedule','team','backline_riders'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END;
$$;


-- ---------------------------------------------------------------------------
-- STEP 3 — BASELINE POLICIES
-- ---------------------------------------------------------------------------

-- ── SHARED: users ──────────────────────────────────────────────────────────
-- Users can read and update their own row; inserts/deletes managed by auth triggers

CREATE POLICY "users_owner_select" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_owner_update" ON public.users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());


-- ── SHARED: user_profiles ──────────────────────────────────────────────────

CREATE POLICY "user_profiles_owner_select" ON public.user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_profiles_owner_insert" ON public.user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_owner_update" ON public.user_profiles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_owner_delete" ON public.user_profiles
  FOR DELETE USING (user_id = auth.uid());


-- ── SHARED: audit_log ─────────────────────────────────────────────────────
-- Read-only for authenticated users (writes via service role / triggers only)

CREATE POLICY "audit_log_owner_select" ON public.audit_log
  FOR SELECT USING (user_id = auth.uid());


-- ── QUOTE APP: quotes ──────────────────────────────────────────────────────

CREATE POLICY "quotes_owner_select" ON public.quotes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "quotes_owner_insert" ON public.quotes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "quotes_owner_update" ON public.quotes
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "quotes_owner_delete" ON public.quotes
  FOR DELETE USING (user_id = auth.uid());


-- ── QUOTE APP: quote_versions (child of quotes) ────────────────────────────

CREATE POLICY "quote_versions_owner_select" ON public.quote_versions
  FOR SELECT USING (
    quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
  );

CREATE POLICY "quote_versions_owner_insert" ON public.quote_versions
  FOR INSERT WITH CHECK (
    quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
  );

CREATE POLICY "quote_versions_owner_update" ON public.quote_versions
  FOR UPDATE USING (
    quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
  );

CREATE POLICY "quote_versions_owner_delete" ON public.quote_versions
  FOR DELETE USING (
    quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
  );


-- ── QUOTE APP: quote_negotiations (child of quotes) ────────────────────────

CREATE POLICY "quote_negotiations_owner_select" ON public.quote_negotiations
  FOR SELECT USING (
    quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
  );

CREATE POLICY "quote_negotiations_owner_insert" ON public.quote_negotiations
  FOR INSERT WITH CHECK (
    quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
  );

CREATE POLICY "quote_negotiations_owner_update" ON public.quote_negotiations
  FOR UPDATE USING (
    quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
  );

CREATE POLICY "quote_negotiations_owner_delete" ON public.quote_negotiations
  FOR DELETE USING (
    quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid())
  );


-- ── QUOTE APP: artists ─────────────────────────────────────────────────────

CREATE POLICY "artists_owner_select" ON public.artists
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "artists_owner_insert" ON public.artists
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "artists_owner_update" ON public.artists
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "artists_owner_delete" ON public.artists
  FOR DELETE USING (user_id = auth.uid());


-- ── QUOTE APP: venues ──────────────────────────────────────────────────────

CREATE POLICY "venues_owner_select" ON public.venues
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "venues_owner_insert" ON public.venues
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "venues_owner_update" ON public.venues
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "venues_owner_delete" ON public.venues
  FOR DELETE USING (user_id = auth.uid());


-- ── MERCHPAD: products ─────────────────────────────────────────────────────

CREATE POLICY "products_owner_select" ON public.products
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "products_owner_insert" ON public.products
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_owner_update" ON public.products
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_owner_delete" ON public.products
  FOR DELETE USING (user_id = auth.uid());


-- ── MERCHPAD: variants (child of products) ─────────────────────────────────

CREATE POLICY "variants_owner_select" ON public.variants
  FOR SELECT USING (
    product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid())
  );

CREATE POLICY "variants_owner_insert" ON public.variants
  FOR INSERT WITH CHECK (
    product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid())
  );

CREATE POLICY "variants_owner_update" ON public.variants
  FOR UPDATE USING (
    product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid())
  );

CREATE POLICY "variants_owner_delete" ON public.variants
  FOR DELETE USING (
    product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid())
  );


-- ── MERCHPAD: sales ────────────────────────────────────────────────────────

CREATE POLICY "sales_owner_select" ON public.sales
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sales_owner_insert" ON public.sales
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sales_owner_update" ON public.sales
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "sales_owner_delete" ON public.sales
  FOR DELETE USING (user_id = auth.uid());


-- ── MERCHPAD: orders ───────────────────────────────────────────────────────

CREATE POLICY "orders_owner_select" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_owner_insert" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_owner_update" ON public.orders
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_owner_delete" ON public.orders
  FOR DELETE USING (user_id = auth.uid());


-- ── MERCHPAD: inventory_logs (child of products) ───────────────────────────

CREATE POLICY "inventory_logs_owner_select" ON public.inventory_logs
  FOR SELECT USING (
    product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid())
  );

CREATE POLICY "inventory_logs_owner_insert" ON public.inventory_logs
  FOR INSERT WITH CHECK (
    product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid())
  );

-- inventory_logs are typically immutable — omit UPDATE/DELETE if append-only


-- ── RUN APP: tours ─────────────────────────────────────────────────────────

CREATE POLICY "tours_owner_select" ON public.tours
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tours_owner_insert" ON public.tours
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tours_owner_update" ON public.tours
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "tours_owner_delete" ON public.tours
  FOR DELETE USING (user_id = auth.uid());


-- ── RUN APP: shows (child of tours) ───────────────────────────────────────

CREATE POLICY "shows_owner_select" ON public.shows
  FOR SELECT USING (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );

CREATE POLICY "shows_owner_insert" ON public.shows
  FOR INSERT WITH CHECK (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );

CREATE POLICY "shows_owner_update" ON public.shows
  FOR UPDATE USING (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );

CREATE POLICY "shows_owner_delete" ON public.shows
  FOR DELETE USING (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );


-- ── RUN APP: schedule (child of tours) ─────────────────────────────────────

CREATE POLICY "schedule_owner_select" ON public.schedule
  FOR SELECT USING (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );

CREATE POLICY "schedule_owner_insert" ON public.schedule
  FOR INSERT WITH CHECK (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );

CREATE POLICY "schedule_owner_update" ON public.schedule
  FOR UPDATE USING (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );

CREATE POLICY "schedule_owner_delete" ON public.schedule
  FOR DELETE USING (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );


-- ── RUN APP: team (child of tours) ─────────────────────────────────────────

CREATE POLICY "team_owner_select" ON public.team
  FOR SELECT USING (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );

CREATE POLICY "team_owner_insert" ON public.team
  FOR INSERT WITH CHECK (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );

CREATE POLICY "team_owner_update" ON public.team
  FOR UPDATE USING (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );

CREATE POLICY "team_owner_delete" ON public.team
  FOR DELETE USING (
    tour_id IN (SELECT id FROM public.tours WHERE user_id = auth.uid())
  );


-- ── RUN APP: backline_riders (child of shows) ──────────────────────────────

CREATE POLICY "backline_riders_owner_select" ON public.backline_riders
  FOR SELECT USING (
    show_id IN (
      SELECT s.id FROM public.shows s
      JOIN public.tours t ON t.id = s.tour_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "backline_riders_owner_insert" ON public.backline_riders
  FOR INSERT WITH CHECK (
    show_id IN (
      SELECT s.id FROM public.shows s
      JOIN public.tours t ON t.id = s.tour_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "backline_riders_owner_update" ON public.backline_riders
  FOR UPDATE USING (
    show_id IN (
      SELECT s.id FROM public.shows s
      JOIN public.tours t ON t.id = s.tour_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "backline_riders_owner_delete" ON public.backline_riders
  FOR DELETE USING (
    show_id IN (
      SELECT s.id FROM public.shows s
      JOIN public.tours t ON t.id = s.tour_id
      WHERE t.user_id = auth.uid()
    )
  );


COMMIT;


-- =============================================================================
-- VERIFICATION — run these AFTER the migration to confirm RLS is active
-- =============================================================================

-- 1. Check RLS is enabled on all 18 tables (should return 18 rows, all TRUE)
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  CASE WHEN rowsecurity THEN '✓' ELSE '✗ NOT ENABLED' END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users','user_profiles','audit_log',
    'quotes','quote_versions','quote_negotiations','artists','venues',
    'products','variants','sales','orders','inventory_logs',
    'tours','shows','schedule','team','backline_riders'
  )
ORDER BY tablename;


-- 2. List every policy created (should return ~60 rows across all tables)
SELECT
  tablename,
  policyname,
  cmd       AS operation,
  qual      AS using_expr,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'users','user_profiles','audit_log',
    'quotes','quote_versions','quote_negotiations','artists','venues',
    'products','variants','sales','orders','inventory_logs',
    'tours','shows','schedule','team','backline_riders'
  )
ORDER BY tablename, cmd;


-- 3. Confirm anon role sees ZERO rows from any table (run as unauthenticated)
--    Expected result: 0 for every table
SELECT 'quotes'             AS tbl, COUNT(*) FROM public.quotes
UNION ALL
SELECT 'products',                  COUNT(*) FROM public.products
UNION ALL
SELECT 'tours',                     COUNT(*) FROM public.tours
UNION ALL
SELECT 'users',                     COUNT(*) FROM public.users;
-- If any count > 0 while anon, a policy is missing or using wrong column name.


-- =============================================================================
-- ROLLBACK — paste this if you need to undo everything
-- =============================================================================
/*
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'users','user_profiles','audit_log',
        'quotes','quote_versions','quote_negotiations','artists','venues',
        'products','variants','sales','orders','inventory_logs',
        'tours','shows','schedule','team','backline_riders'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END;
$$;

ALTER TABLE public.users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_negotiations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.backline_riders DISABLE ROW LEVEL SECURITY;
*/
