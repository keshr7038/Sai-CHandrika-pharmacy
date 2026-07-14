import React from 'react';
import { 
  Activity, Phone, MapPin, MessageSquare, ShieldAlert, Heart, 
  ChevronRight, ArrowLeft, Clock, AlertTriangle, Compass, Check
} from 'lucide-react';

export default function EmergencyPage() {
  const publicHelplines = [
    { name: 'National Emergency Number', number: '112', desc: 'All-in-one emergency response service' },
    { name: 'Ambulance Services', number: '108', desc: 'Free government medical dispatch' },
    { name: 'Police Helpline', number: '100', desc: 'Immediate local law enforcement' },
    { name: 'Fire Station', number: '101', desc: 'Local fire safety and response' },
    { name: 'Women Helpline', number: '1091', desc: 'Assistance and support for women' },
    { name: 'National Blood Bank Helpline', number: '104', desc: 'Blood availability query and info' },
  ];

  const firstAidGuidelines = [
    {
      title: 'CPR (Cardiopulmonary Resuscitation)',
      icon: '❤️',
      steps: [
        'Call 108/112 immediately for emergency support.',
        'Place hands in the center of the chest and push hard & fast (100-120 compressions per minute).',
        'Allow chest to recoil fully between compressions.',
        'If trained, deliver 2 rescue breaths after every 30 compressions.'
      ]
    },
    {
      title: 'Severe Bleeding Control',
      icon: '🩹',
      steps: [
        'Apply direct pressure to the wound using a clean cloth or bandage.',
        'Elevate the injured limb above heart level if possible.',
        'Keep pressure applied firmly until professional medical help arrives.',
        'Do not remove blood-soaked dressings; add more layers on top.'
      ]
    },
    {
      title: 'Thermal & Chemical Burns',
      icon: '🔥',
      steps: [
        'Cool the burn immediately with cool running tap water for 10-20 minutes.',
        'Do not apply ice, butter, toothpaste, or oil (this traps heat).',
        'Cover the burn loosely with sterile non-stick dressing or clean plastic wrap.',
        'Seek immediate professional emergency care for major or blistering burns.'
      ]
    },
    {
      title: 'Fractures & Sprains',
      icon: '🦴',
      steps: [
        'Keep the injured area still and avoid attempting to realign the bone.',
        'Apply a cold pack wrapped in a cloth to reduce swelling.',
        'Create a temporary splint to immobilize the joint above and below the fracture.',
        'Avoid applying direct weight or moving the patient unnecessarily.'
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ===== HEADER BANNER ===== */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 backdrop-blur-sm mb-3">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            SOS Emergency Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">24/7 Medical Emergency Desk</h1>
          <p className="text-sm text-white/90 mt-2 font-medium max-w-lg">
            Immediate dispatch, hospital coordinates, direct hotline dials, and life-saving first-aid guidelines. We are here to help you in times of urgent need.
          </p>
        </div>
        {/* Background decorative icons */}
        <div className="absolute right-6 bottom-4 opacity-10 hidden sm:block">
          <Activity className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* ===== GRID SECTION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Primary Actions & Guidelines */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Ambulance Dispatch */}
            <div className="card p-5 bg-gradient-to-br from-red-50/50 to-rose-50/40 dark:from-red-955/20 dark:to-transparent border border-red-100 dark:border-red-900/40 rounded-3xl flex flex-col justify-between shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚑</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Ambulance Dispatch</h3>
                    <p className="text-[11px] text-gray-400">Emergency support & patient transport</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed pt-1">
                  Connect immediately with free government medical dispatch services for urgent assistance.
                </p>
              </div>
              <a 
                href="tel:108"
                className="mt-4 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 px-4 flex items-center justify-between shadow-md transition-all duration-200 cursor-pointer font-bold"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4.5 h-4.5 animate-bounce" />
                  <span>Call Ambulance (108)</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Pharmacy Emergency Support */}
            <div className="card p-5 bg-gradient-to-br from-green-50/50 to-emerald-50/40 dark:from-green-955/20 dark:to-transparent border border-green-100 dark:border-green-900/40 rounded-3xl flex flex-col justify-between shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Pharmacy SOS desk</h3>
                    <p className="text-[11px] text-gray-400">Express delivery & medical assistance</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed pt-1">
                  Get in touch with the Sai Chandrika Pharmacy store operator for immediate medicine delivery.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <a 
                  href="tel:+919876543210"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 px-2 flex items-center justify-center gap-1.5 shadow-sm text-xs font-bold transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Call Shop
                </a>
                <a 
                  href="https://wa.me/919876543210?text=EMERGENCY%20ASSISTANCE%20REQUIRED"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 px-2 flex items-center justify-center gap-1.5 shadow-sm text-xs font-bold transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>

          </div>

          {/* Life-Saving First Aid Guidelines */}
          <div className="card p-6 bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2.5 mb-5 border-b border-gray-100 pb-3">
              <Heart className="w-5 h-5 text-red-650 animate-pulse fill-red-605" />
              <h2 className="text-base font-bold text-gray-800">Essential First Aid Guidelines</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {firstAidGuidelines.map((guide, idx) => (
                <div key={idx} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/60 flex flex-col space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl shrink-0">{guide.icon}</span>
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide leading-tight">{guide.title}</h3>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {guide.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 text-[11px] text-gray-600 leading-relaxed">
                        <span className="text-primary-500 font-bold shrink-0 mt-0.5">✔</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Hospital maps & Public Helplines */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Nearby Hospital Directory */}
          <div className="card p-5 bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2.5 mb-4 border-b border-gray-150 pb-2">
              <Compass className="w-5 h-5 text-primary-650" />
              <h2 className="text-sm font-bold text-gray-805">Hospital Directory & Map</h2>
            </div>
            <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
              Find maps coordinates and emergency contacts for the nearest fully-equipped trauma hospitals in the area.
            </p>
            <div className="space-y-3">
              <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100/60 flex flex-col space-y-3">
                <div className="flex items-start justify-between min-w-0">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 truncate">City Hospital - Bhongir</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Distance: ~2.5 km • Trauma Center</p>
                  </div>
                </div>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=City+Hospital+Bhongir"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 shadow-sm text-xs font-bold transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  View on Google Maps
                </a>
              </div>

              <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100/60 flex flex-col space-y-3">
                <div className="flex items-start justify-between min-w-0">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 truncate">Apollo Clinic - Hyderabad</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Distance: ~12 km • Multi-specialty</p>
                  </div>
                </div>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Apollo+Clinic+Hyderabad"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 shadow-sm text-xs font-bold transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Public Emergency Helplines */}
          <div className="card p-5 bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2.5 mb-3 border-b border-gray-150 pb-2">
              <Phone className="w-4.5 h-4.5 text-primary-650" />
              <h2 className="text-sm font-bold text-gray-805">Public Emergency Helplines</h2>
            </div>
            <div className="space-y-3">
              {publicHelplines.map((helpline, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-xs font-semibold text-gray-750">{helpline.name}</p>
                    <p className="text-[10px] text-gray-405">{helpline.desc}</p>
                  </div>
                  <a 
                    href={`tel:${helpline.number}`}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-650 text-xs font-bold transition-colors cursor-pointer"
                    title={`Call ${helpline.number}`}
                  >
                    {helpline.number}
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
