-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id TEXT NOT NULL,
  payment_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL, -- amount in paise
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Select policy: Customers can read their own payments, owners can read all payments
DROP POLICY IF EXISTS "Allow users to read own payments" ON payments;
CREATE POLICY "Allow users to read own payments" ON payments
  FOR SELECT USING (
    (auth.uid() = user_id) OR
    (EXISTS (
      SELECT 1 FROM owners WHERE email = auth.email()
    ))
  );

-- Insert policy: Allow all inserts (handled by backend or public webhook inserts, secured by backend verify calls)
DROP POLICY IF EXISTS "Allow all inserts" ON payments;
CREATE POLICY "Allow all inserts" ON payments
  FOR INSERT WITH CHECK (true);
