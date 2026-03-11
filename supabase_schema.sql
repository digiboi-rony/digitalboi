-- ============================================================
-- DIGIBOI — Complete Database Schema
-- Supabase SQL Editor এ এটি Run করুন
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone           VARCHAR(20)  UNIQUE,
  email           VARCHAR(255) UNIQUE,
  password_hash   TEXT         NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  role            VARCHAR(30)  NOT NULL DEFAULT 'owner'
                    CHECK (role IN ('super_admin','owner','manager','cashier','stock_manager','viewer','staff')),
  profile_photo   TEXT,
  nid_number      VARCHAR(30),
  nid_front_photo TEXT,
  nid_back_photo  TEXT,
  nid_verified    BOOLEAN      NOT NULL DEFAULT false,
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── SHOPS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shops (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_name           VARCHAR(255) NOT NULL,
  business_type       VARCHAR(20)  NOT NULL DEFAULT 'physical'
                        CHECK (business_type IN ('physical','online','both')),
  shop_logo           TEXT,
  shop_banner         TEXT,
  shop_photos         TEXT[]       DEFAULT '{}',
  address             TEXT,
  district            VARCHAR(100),
  trade_license       TEXT,
  fb_page_url         TEXT,
  online_platforms    TEXT[]       DEFAULT '{}',
  online_proof_photo  TEXT,
  verification_code   VARCHAR(30),
  online_verified     BOOLEAN      DEFAULT false,
  online_verified_at  TIMESTAMPTZ,
  subscription_plan   VARCHAR(20)  NOT NULL DEFAULT 'free'
                        CHECK (subscription_plan IN ('free','basic','premium')),
  subscription_expires TIMESTAMPTZ,
  currency            VARCHAR(5)   NOT NULL DEFAULT 'BDT',
  is_active           BOOLEAN      NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── STAFF ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(30) NOT NULL DEFAULT 'cashier',
  permissions JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, user_id)
);

-- ─── CATEGORIES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id   UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name      VARCHAR(100) NOT NULL,
  icon      VARCHAR(10)  DEFAULT '📦',
  color     VARCHAR(10)  DEFAULT '#0F4C81',
  sort_order INT         DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PRODUCTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  barcode         VARCHAR(100),
  name            VARCHAR(255) NOT NULL,
  brand           VARCHAR(100),
  description     TEXT,
  main_photo      TEXT,
  extra_photos    TEXT[]  DEFAULT '{}',
  purchase_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price   NUMERIC(12,2) NOT NULL,
  current_stock   NUMERIC(12,3) NOT NULL DEFAULT 0,
  min_stock_alert NUMERIC(12,3) NOT NULL DEFAULT 5,
  unit            VARCHAR(20)   NOT NULL DEFAULT 'pcs',
  expiry_date     DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CUSTOMERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id      UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  phone        VARCHAR(20),
  email        VARCHAR(255),
  address      TEXT,
  notes        TEXT,
  due_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_spent  NUMERIC(12,2) NOT NULL DEFAULT 0,
  visit_count  INT           NOT NULL DEFAULT 0,
  last_visit   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── SUPPLIERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id     UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  email       VARCHAR(255),
  address     TEXT,
  notes       TEXT,
  due_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_paid  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── SALES ────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS sale_invoice_seq;

CREATE TABLE IF NOT EXISTS sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  VARCHAR(30) NOT NULL DEFAULT
                    'INV-' || TO_CHAR(NOW(),'YYYYMM') || '-' || LPAD(NEXTVAL('sale_invoice_seq')::TEXT,4,'0'),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  staff_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  subtotal        NUMERIC(12,2) NOT NULL,
  discount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL,
  paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method  VARCHAR(20)   NOT NULL DEFAULT 'cash',
  payment_status  VARCHAR(20)   NOT NULL DEFAULT 'paid'
                    CHECK (payment_status IN ('paid','due','partial')),
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── SALE ITEMS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id      UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity     NUMERIC(12,3) NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL,
  discount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total        NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── PURCHASES ────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS purchase_invoice_seq;

CREATE TABLE IF NOT EXISTS purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  VARCHAR(30) NOT NULL DEFAULT
                    'PUR-' || TO_CHAR(NOW(),'YYYYMM') || '-' || LPAD(NEXTVAL('purchase_invoice_seq')::TEXT,4,'0'),
  shop_id         UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  supplier_id     UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  staff_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  total           NUMERIC(12,2) NOT NULL,
  paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status  VARCHAR(20)   NOT NULL DEFAULT 'paid'
                    CHECK (payment_status IN ('paid','due','partial')),
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── PURCHASE ITEMS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id  UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255)  NOT NULL,
  quantity     NUMERIC(12,3) NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL,
  total        NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── EXPENSES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id        UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  staff_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  category       VARCHAR(100) NOT NULL,
  amount         NUMERIC(12,2) NOT NULL,
  description    TEXT,
  payment_method VARCHAR(20) DEFAULT 'cash',
  receipt_photo  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PAYMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id        UUID NOT NULL REFERENCES shops(id),
  entity_type    VARCHAR(20) NOT NULL CHECK (entity_type IN ('sale','purchase','expense')),
  entity_id      UUID NOT NULL,
  amount         NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── OTP REQUESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_requests (
  phone      VARCHAR(20) PRIMARY KEY,
  otp        VARCHAR(6)  NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ACTIVITY LOGS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  shop_id    UUID REFERENCES shops(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,
  details    JSONB        DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id    UUID REFERENCES shops(id) ON DELETE CASCADE,
  type       VARCHAR(20) NOT NULL DEFAULT 'info'
               CHECK (type IN ('info','success','warning','danger')),
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- TRIGGERS
-- ──────────────────────────────────────────────────────────

-- Auto decrease stock on sale
CREATE OR REPLACE FUNCTION decrease_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET current_stock = current_stock - NEW.quantity,
        updated_at    = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decrease_stock ON sale_items;
CREATE TRIGGER trg_decrease_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION decrease_stock_on_sale();

-- Auto increase stock on purchase
CREATE OR REPLACE FUNCTION increase_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET current_stock = current_stock + NEW.quantity,
        purchase_price = NEW.unit_price,
        updated_at     = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increase_stock ON purchase_items;
CREATE TRIGGER trg_increase_stock
  AFTER INSERT ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION increase_stock_on_purchase();

-- Auto update customer stats
CREATE OR REPLACE FUNCTION update_customer_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET due_amount   = due_amount   + COALESCE(NEW.due_amount,0),
        total_spent  = total_spent  + NEW.total,
        visit_count  = visit_count  + 1,
        last_visit   = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_sale ON sales;
CREATE TRIGGER trg_customer_sale
  AFTER INSERT ON sales
  FOR EACH ROW EXECUTE FUNCTION update_customer_on_sale();

-- Helper: increment customer due (used by API)
CREATE OR REPLACE FUNCTION increment_customer_due(p_customer_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE customers SET due_amount = due_amount + p_amount WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','shops','products'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%I ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_touch_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', t, t);
  END LOOP;
END $$;

-- ──────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_barcode    ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_shop       ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_shop_date     ON sales(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer      ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop      ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone     ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_activity_user       ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user          ON notifications(user_id, is_read);

-- ──────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────────────────
ALTER TABLE shops     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────
-- SEED DATA
-- ──────────────────────────────────────────────────────────

-- Super admin (password: Digiboi@2025)
INSERT INTO users (phone, email, full_name, role, password_hash, nid_verified, is_active)
VALUES ('+8801700000000', 'admin@digiboi.app', 'MD. Rakibul Hasan Rony', 'super_admin',
        '$2b$10$x5gLW3F7Y2P1K9mN0vR8uuXjHQg4ZkT1iE6dWsAoMqPbCDfVneLyS', true, true)
ON CONFLICT (phone) DO NOTHING;

-- Default categories for demo shop
-- (Run after creating a shop and replacing the UUID)
-- INSERT INTO categories (shop_id, name, icon, color) VALUES
-- ('YOUR-SHOP-ID', 'খাদ্য', '🍚', '#0F4C81'),
-- ('YOUR-SHOP-ID', 'তেল', '🫙', '#F4A261'),
-- ('YOUR-SHOP-ID', 'দুগ্ধ', '🥛', '#4361EE'),
-- ('YOUR-SHOP-ID', 'পানীয়', '🥤', '#0BAA69'),
-- ('YOUR-SHOP-ID', 'প্রসাধনী', '🧴', '#8B5CF6'),
-- ('YOUR-SHOP-ID', 'বিবিধ', '📦', '#5E6E8A');

-- ✅ Schema setup complete!
-- পরবর্তী ধাপ: Vercel এ Environment Variables দিন এবং Deploy করুন।
