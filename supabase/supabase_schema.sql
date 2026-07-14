-- Complete database schema for Medical Shop POS (Shekar Medicals POS)

-- 1. Owners Table
CREATE TABLE IF NOT EXISTS owners (
  email TEXT PRIMARY KEY
);

-- 2. Owner Logs Table
CREATE TABLE IF NOT EXISTS owner_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT REFERENCES owners(email) ON DELETE CASCADE,
  login_time TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Owner Login Logs Table
CREATE TABLE IF NOT EXISTS owner_login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT, -- stores login email
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_login TIMESTAMPTZ
);

-- 5. Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT DEFAULT 'Uncategorized',
  dosage_form TEXT DEFAULT 'Tablet',
  packaging TEXT DEFAULT 'Strip',
  tablets_per_sheet INTEGER DEFAULT 10,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  purchase_price NUMERIC DEFAULT 0.0,
  selling_price NUMERIC DEFAULT 0.0,
  shelf_location TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  contact TEXT,
  email TEXT,
  address TEXT,
  due_amount NUMERIC DEFAULT 0.0,
  status TEXT DEFAULT 'active',
  items_supplied TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT now() NOT NULL,
  customer_name TEXT DEFAULT 'Walk-in Customer',
  customer_phone TEXT,
  tax NUMERIC DEFAULT 0.0,
  discount NUMERIC DEFAULT 0.0,
  total NUMERIC DEFAULT 0.0,
  payment_method TEXT DEFAULT 'Cash',
  payment_status TEXT DEFAULT 'Pending',
  cashier TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  medicine_id TEXT REFERENCES medicines(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT now() NOT NULL,
  vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_name TEXT,
  total NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. Purchase Items Table
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id TEXT REFERENCES purchases(id) ON DELETE CASCADE,
  medicine_id TEXT REFERENCES medicines(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  purchase_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  status TEXT DEFAULT 'sent',
  method TEXT DEFAULT 'simulated',
  twilio_sid TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 12. Payments Table (Razorpay Webhook integrations)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id TEXT NOT NULL,
  payment_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL, -- amount in paise
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for security, but allow necessary public policies for the POS app
-- Since the POS client accesses data via anon key:

-- Enable RLS on critical tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- Enable RLS policies for payments
DROP POLICY IF EXISTS "Allow users to read own payments" ON payments;
CREATE POLICY "Allow users to read own payments" ON payments
  FOR SELECT USING (
    (auth.uid() = user_id) OR
    (EXISTS (
      SELECT 1 FROM owners WHERE email = auth.email()
    ))
  );

DROP POLICY IF EXISTS "Allow all inserts" ON payments;
CREATE POLICY "Allow all inserts" ON payments
  FOR INSERT WITH CHECK (true);

-- Enable RLS policies for owners
DROP POLICY IF EXISTS "Allow public read access to owners" ON owners;
CREATE POLICY "Allow public read access to owners" ON owners
  FOR SELECT USING (true);
