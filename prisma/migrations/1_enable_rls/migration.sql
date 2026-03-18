-- Enable RLS on all user-facing tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "positions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trade_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "symbols" ENABLE ROW LEVEL SECURITY;

-- Users: can only see/modify their own row
CREATE POLICY "users_own_row" ON "users"
  FOR ALL USING (auth_id = auth.uid()::text);

-- Accounts: can only see/modify accounts they own
CREATE POLICY "accounts_own" ON "accounts"
  FOR ALL USING (
    user_id IN (SELECT id FROM "users" WHERE auth_id = auth.uid()::text)
  );

-- Trades: can only see/modify trades in their accounts
CREATE POLICY "trades_own" ON "trades"
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM "accounts" a
      JOIN "users" u ON a.user_id = u.id
      WHERE u.auth_id = auth.uid()::text
    )
  );

-- Positions: can only see/modify positions in their trades
CREATE POLICY "positions_own" ON "positions"
  FOR ALL USING (
    trade_id IN (
      SELECT t.id FROM "trades" t
      JOIN "accounts" a ON t.account_id = a.id
      JOIN "users" u ON a.user_id = u.id
      WHERE u.auth_id = auth.uid()::text
    )
  );

-- Trade images: can only see/modify images in their trades
CREATE POLICY "trade_images_own" ON "trade_images"
  FOR ALL USING (
    trade_id IN (
      SELECT t.id FROM "trades" t
      JOIN "accounts" a ON t.account_id = a.id
      JOIN "users" u ON a.user_id = u.id
      WHERE u.auth_id = auth.uid()::text
    )
  );

-- Symbols: everyone can read (public data)
CREATE POLICY "symbols_read_all" ON "symbols"
  FOR SELECT USING (true);

-- Prisma connects via DATABASE_URL (postgres role) which bypasses RLS.
-- These policies protect against direct Supabase API access (anon/authenticated roles).
-- To ensure Prisma isn't affected, grant bypass to the postgres role:
ALTER ROLE "postgres" BYPASSRLS;
