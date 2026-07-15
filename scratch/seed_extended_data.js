require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sampleDoctors = [
  {
    name: 'Dr. Ramesh Kumar',
    email: 'ramesh.kumar@example.com',
    qualification: 'MBBS, MD (General Medicine)',
    specialization: 'General Physician',
    experience: 12,
    consultation_fee: 300,
    available_days: 'Monday,Wednesday,Friday',
    available_slots: '10:00 AM,11:00 AM,12:00 PM,02:00 PM,03:00 PM',
    languages: 'English,Hindi,Telugu',
    about: 'Dr. Ramesh Kumar is a highly experienced General Physician specializing in chronic disease management, diabetes control, and preventive health screenings.',
    profile_picture: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=256&auto=format&fit=crop'
  },
  {
    name: 'Dr. Anitha Reddy',
    email: 'anitha.reddy@example.com',
    qualification: 'MBBS, DNB (Paediatrics)',
    specialization: 'Paediatrician',
    experience: 9,
    consultation_fee: 350,
    available_days: 'Tuesday,Thursday,Saturday',
    available_slots: '10:00 AM,11:30 AM,02:30 PM,04:00 PM',
    languages: 'English,Telugu,Tamil',
    about: 'Dr. Anitha Reddy is a dedicated pediatrician committed to providing compassionate, comprehensive medical care for children from infancy through adolescence.',
    profile_picture: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=256&auto=format&fit=crop'
  },
  {
    name: 'Dr. Sanjay Mehta',
    email: 'sanjay.mehta@example.com',
    qualification: 'MBBS, MS, MCh (Cardiology)',
    specialization: 'Cardiologist',
    experience: 15,
    consultation_fee: 500,
    available_days: 'Monday,Tuesday,Thursday,Friday',
    available_slots: '11:00 AM,12:00 PM,03:00 PM,05:00 PM',
    languages: 'English,Hindi,Gujarati',
    about: 'Dr. Sanjay Mehta is a leading cardiologist with expert training in interventional cardiology, heart failure management, and vascular care.',
    profile_picture: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=256&auto=format&fit=crop'
  }
];

const sampleDeliveryStaff = [
  {
    name: 'Kiran Goud',
    email: 'kiran.goud@example.com',
    phone: '9876543211',
    vehicle: 'Honda Activa (TS-08-EF-1234)',
    status: 'Active',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'
  },
  {
    name: 'Mahesh Yadav',
    email: 'mahesh.yadav@example.com',
    phone: '9876543212',
    vehicle: 'Hero Splendor (TS-08-GH-5678)',
    status: 'Active',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop'
  }
];

const deliverySettings = {
  id: 1,
  radius_km: 10.0,
  charge: 40.0,
  min_order_amount: 150.0,
  free_delivery_above: 500.0,
  serviceable_pincodes: '508116,500001,500002,500003,500012'
};

async function seed() {
  console.log("🚀 Starting database seeding for Clinic & Delivery system...");

  try {
    // 1. Seed Doctors
    console.log("Seeding doctors...");
    for (const doc of sampleDoctors) {
      const { error } = await supabase
        .from('doctors')
        .upsert(doc, { onConflict: 'email' });
      if (error) console.error(`❌ Error seeding doctor ${doc.name}:`, error.message);
      else console.log(`✓ Doctor seeded: ${doc.name}`);
    }

    // 2. Seed Delivery Staff
    console.log("Seeding delivery staff...");
    for (const staff of sampleDeliveryStaff) {
      const { error } = await supabase
        .from('delivery_staff')
        .upsert(staff, { onConflict: 'email' });
      if (error) console.error(`❌ Error seeding staff ${staff.name}:`, error.message);
      else console.log(`✓ Delivery staff seeded: ${staff.name}`);
    }

    // 3. Seed Settings
    console.log("Seeding delivery settings...");
    const { error: settingsErr } = await supabase
      .from('delivery_settings')
      .upsert(deliverySettings, { onConflict: 'id' });
    if (settingsErr) console.error("❌ Error seeding settings:", settingsErr.message);
    else console.log("✓ Delivery settings seeded successfully.");

    console.log("🎉 Seeding complete!");

  } catch (err) {
    console.error("❌ Seeding failed with exception:", err);
  }
}

seed();
