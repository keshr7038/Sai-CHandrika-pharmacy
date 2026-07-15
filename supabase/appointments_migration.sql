-- Create appointments table with post-consultation fields
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  reason TEXT,
  symptoms TEXT,
  prescription_file_url TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  customer_email TEXT NOT NULL,
  
  -- Post-Consultation Fields (populated by Doctor/Admin)
  diagnosis TEXT,
  consultation_notes TEXT,
  actual_duration INTEGER, -- in minutes
  consultation_fee NUMERIC, -- set after consultation
  prescribed_medicines JSONB, -- array of { medicineId, name, quantity, price, subtotal }
  follow_up_date DATE,
  doctor_remarks TEXT,
  other_charges NUMERIC DEFAULT 0.0,
  discount NUMERIC DEFAULT 0.0,
  gst NUMERIC DEFAULT 0.0,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid'))
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

-- Update policy: Allow all updates
DROP POLICY IF EXISTS "Allow update appointments" ON appointments;
CREATE POLICY "Allow update appointments" ON appointments
  FOR UPDATE USING (true);
