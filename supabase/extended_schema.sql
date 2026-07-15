-- Extended database schema for Clinic & Delivery Management Upgrades

-- 1. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  qualification TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience INTEGER DEFAULT 1,
  consultation_fee NUMERIC DEFAULT 0.0,
  available_days TEXT DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday',
  available_slots TEXT DEFAULT '10:00 AM,11:00 AM,12:00 PM,02:00 PM,03:00 PM,04:00 PM',
  languages TEXT DEFAULT 'English,Hindi,Telugu',
  profile_picture TEXT,
  about TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY, -- e.g., 'APT-10001'
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender TEXT NOT NULL,
  reason TEXT,
  appointment_date DATE NOT NULL,
  appointment_slot TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY, -- e.g., 'RX-20001'
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  diagnosis TEXT,
  symptoms TEXT,
  advice TEXT,
  follow_up_date DATE,
  doctor_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Prescription Items Table
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id TEXT REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id TEXT REFERENCES medicines(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  dosage TEXT NOT NULL, -- e.g., '1-0-1'
  timing TEXT NOT NULL, -- e.g., 'After Food', 'Before Food'
  duration INTEGER NOT NULL, -- in days
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Delivery Addresses Table
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  landmark TEXT,
  phone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Delivery Staff Table
CREATE TABLE IF NOT EXISTS delivery_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Busy')),
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Delivery Orders Table
CREATE TABLE IF NOT EXISTS delivery_orders (
  id TEXT PRIMARY KEY REFERENCES sales(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  delivery_address_id UUID REFERENCES delivery_addresses(id) ON DELETE SET NULL,
  delivery_charge NUMERIC DEFAULT 0.0,
  delivery_executive_id UUID REFERENCES delivery_staff(id) ON DELETE SET NULL,
  otp TEXT NOT NULL, -- 4-digit code
  status TEXT DEFAULT 'Order Placed' CHECK (status IN ('Order Placed', 'Accepted', 'Preparing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled')),
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Delivery Status History / Tracking
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_order_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by TEXT,
  notes TEXT
);

-- 9. Notification History Table
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. Delivery Settings Table
CREATE TABLE IF NOT EXISTS delivery_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  radius_km NUMERIC DEFAULT 10.0,
  charge NUMERIC DEFAULT 50.0,
  min_order_amount NUMERIC DEFAULT 200.0,
  free_delivery_above NUMERIC DEFAULT 500.0,
  serviceable_pincodes TEXT DEFAULT '508116,500001,500002,500003'
);
