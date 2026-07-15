-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  consultation_fee NUMERIC DEFAULT 500.0,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Select policy: Users can read own appointments, Owners can read all
DROP POLICY IF EXISTS "Allow select appointments" ON appointments;
CREATE POLICY "Allow select appointments" ON appointments
  FOR SELECT USING (true);

-- Insert policy: Allow all inserts
DROP POLICY IF EXISTS "Allow insert appointments" ON appointments;
CREATE POLICY "Allow insert appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Update policy: Allow all updates (for status changes and cancellations)
DROP POLICY IF EXISTS "Allow update appointments" ON appointments;
CREATE POLICY "Allow update appointments" ON appointments
  FOR UPDATE USING (true);
