import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import QuantitySelector from './QuantitySelector';
import { 
  ShoppingCart, Zap, Heart, Scale, X, Check, ChevronDown, ChevronUp, Star, Award, Shield, Stethoscope, Briefcase
} from 'lucide-react';

const kitsData = [
  {
    id: 'KIT-001',
    name: 'Mini First Aid Kit',
    tag: 'Pocket Emergency Kit',
    bestFor: ['Travel', 'School', 'Office', 'Bike'],
    price: 199,
    mrp: 299,
    totalItems: '28+',
    badge: null,
    icon: '🎒',
    iconColor: 'bg-rose-50 text-rose-500 border-rose-100',
    description: 'Compact and portable first aid kit designed for immediate minor wound care and on-the-go travel emergencies.',
    items: [
      '10 Adhesive Bandages (Assorted)',
      '2 Sterile Gauze Pads',
      '1 Small Crepe Bandage',
      '1 Medical Adhesive Tape',
      '5 Antiseptic Wipes',
      '2 Alcohol Swabs',
      '1 Antiseptic Solution (Small)',
      '1 Antibiotic Ointment',
      '1 Small Scissors',
      '1 Plastic Tweezers',
      '2 Pairs Disposable Gloves',
      '1 First Aid Guide Card'
    ],
    features: {
      itemsCount: '28+ Items',
      travel: 'Yes (Pocket Size)',
      home: 'Basic Care',
      vehicle: 'Bike / Scooter',
      office: 'No',
      emergency: 'Minor Cuts',
      burn: 'Ointment Only',
      cpr: 'No',
      thermometer: 'No',
      bp: 'No',
      oximeter: 'No',
      survival: 'Guide Card'
    }
  },
  {
    id: 'KIT-002',
    name: 'Essential Family First Aid Kit',
    tag: 'Home Essentials',
    bestFor: ['Home', 'Apartment', 'Students'],
    price: 499,
    mrp: 799,
    totalItems: '60+',
    badge: 'Best Value',
    icon: '🧳',
    iconColor: 'bg-purple-50 text-purple-600 border-purple-100',
    description: 'Essential home first aid kit with comprehensive supplies for treating everyday cuts, scrapes, burns, and minor injuries.',
    items: [
      'Everything from Mini Kit',
      '20 Extra Adhesive Bandages',
      '5 Large Sterile Gauze Pads',
      '2 Roller Bandages',
      '2 Crepe Bandages',
      '1 Triangular Bandage',
      '1 Instant Cold Pack',
      'Burn Dressing',
      'Burn Gel Sachets',
      'Cotton Roll',
      'Safety Pins',
      'Digital Thermometer',
      'Eye Wash Solution',
      'Saline Pods',
      'CPR Face Shield',
      'Emergency Blanket'
    ],
    features: {
      itemsCount: '60+ Items',
      travel: 'Yes (Compact)',
      home: 'Recommended',
      vehicle: 'Car / Apartment',
      office: 'Basic',
      emergency: 'Daily Household',
      burn: 'Gel & Dressings',
      cpr: 'CPR Face Shield',
      thermometer: 'Digital',
      bp: 'No',
      oximeter: 'No',
      survival: 'Emergency Blanket'
    }
  },
  {
    id: 'KIT-003',
    name: 'Family Plus First Aid Kit',
    tag: 'Complete Home Care',
    bestFor: ['Large Families', 'Multi-generational'],
    price: 999,
    mrp: 1599,
    totalItems: '90+',
    badge: 'Most Popular',
    icon: '📦',
    iconColor: 'bg-amber-50 text-amber-600 border-amber-100',
    description: 'Comprehensive family healthcare solution stocked with a wider selection of bandages, burn dressings, splints, and diagnostic aids.',
    items: [
      'Everything from Essential Family Kit',
      'Elastic Compression Bandage',
      'Finger Splint',
      'Finger Bandages',
      'Knuckle Bandages',
      'Butterfly Wound Closures',
      'Non-Adherent Dressings',
      'Additional Burn Dressings',
      'Extra Sterile Gloves',
      'Medical Mask',
      'Tick Remover Tweezers',
      'Emergency Whistle',
      'Notebook & Pencil',
      'Large Trauma Dressing',
      'Extra Gauze Rolls',
      'Sterile Eye Pad'
    ],
    features: {
      itemsCount: '90+ Items',
      travel: 'Yes (Standard)',
      home: 'Excellent',
      vehicle: 'Car / Family SUV',
      office: 'Yes',
      emergency: 'Comprehensive',
      burn: 'Advanced Dressings',
      cpr: 'CPR Face Shield',
      thermometer: 'Digital',
      bp: 'No',
      oximeter: 'No',
      survival: 'Emergency Whistle & Splint'
    }
  },
  {
    id: 'KIT-004',
    name: 'Travel & Adventure First Aid Kit',
    tag: 'Outdoor Safety',
    bestFor: ['Car', 'Trekking', 'Camping', 'Road Trips'],
    price: 1499,
    mrp: 2299,
    totalItems: '120+',
    badge: null,
    icon: '🏕️',
    iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    description: 'Rugged outdoor survival first aid kit packed with essential items for hiking, camping, road trips, and minor wilderness emergencies.',
    items: [
      'Everything from Family Plus Kit',
      'Emergency Rain Poncho',
      'Emergency Survival Blanket',
      'Flashlight',
      'Waterproof Matches',
      'Waterproof Storage Bags',
      'Multi-tool',
      'Compass',
      'Extra CPR Mask',
      'Instant Ice Packs',
      'Emergency Glow Stick',
      'Insect Bite Relief',
      'Mosquito Repellent',
      'Sunscreen Sachets',
      'Electrolyte ORS Packs',
      'Motion Sickness Bags'
    ],
    features: {
      itemsCount: '120+ Items',
      travel: 'Excellent (Rugged Case)',
      home: 'Good',
      vehicle: 'Recommended',
      office: 'Yes',
      emergency: 'Outdoor & Survival',
      burn: 'Advanced Dressings',
      cpr: 'CPR Mask',
      thermometer: 'Digital',
      bp: 'No',
      oximeter: 'No',
      survival: 'Compass, Multi-tool, Flashlight'
    }
  },
  {
    id: 'KIT-005',
    name: 'Premium Emergency Medical Kit',
    tag: 'Professional Complete Kit',
    bestFor: ['Clinics', 'Offices', 'Schools', 'Factories'],
    price: 2999,
    mrp: 4499,
    totalItems: '150+',
    badge: 'Professional Choice',
    icon: '🏥',
    iconColor: 'bg-primary-50 text-primary-600 border-primary-100',
    description: 'Professional-grade emergency medical responder kit with advanced diagnostic tools, trauma dressings, oximeter, and BP monitor.',
    items: [
      'Everything from Travel & Adventure Kit',
      'Large Sterile Dressings',
      'Multiple Trauma Dressings',
      'Heavy Duty Bandage Scissors',
      'Premium Stainless Steel Tweezers',
      'Digital Blood Pressure Monitor',
      'Pulse Oximeter',
      'Premium Digital Thermometer',
      'Additional CPR Mask',
      'Extra Gloves',
      'Large Crepe Bandages',
      'Additional Eye Wash',
      'Extra Medical Tape',
      'Multiple Burn Dressings',
      'Large Emergency Blanket',
      'Biohazard Waste Bags',
      'First Aid Manual'
    ],
    features: {
      itemsCount: '150+ Items',
      travel: 'Large (Wall-Mountable)',
      home: 'Overkill',
      vehicle: 'Yes',
      office: 'Recommended',
      emergency: 'Professional Trauma',
      burn: 'Complete Burn Dressing Kit',
      cpr: 'Dual CPR Masks',
      thermometer: 'Premium Digital',
      bp: 'Yes (Digital BP Monitor)',
      oximeter: 'Yes (Pulse Oximeter)',
      survival: 'BP Monitor, Oximeter, Manual'
    }
  }
];

export default function FirstAidKitsSection({ setCurrentTab }) {
  const { addToCart, addNotification, cart, removeFromCart, updateCartQuantity } = useContext(AppContext);
  const [expandedKit, setExpandedKit] = useState(null);
  const [comparedKits, setComparedKits] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  const toggleExpand = (kitId) => {
    setExpandedKit(expandedKit === kitId ? null : kitId);
  };

  const toggleWishlist = (kitId) => {
    if (wishlist.includes(kitId)) {
      setWishlist(wishlist.filter(id => id !== kitId));
      addNotification('Removed from wishlist.', 'info');
    } else {
      setWishlist([...wishlist, kitId]);
      addNotification('Saved to wishlist successfully!', 'success');
    }
  };

  const toggleCompare = (kit) => {
    if (comparedKits.find(k => k.id === kit.id)) {
      setComparedKits(comparedKits.filter(k => k.id !== kit.id));
    } else {
      if (comparedKits.length >= 4) {
        addNotification('You can compare up to 4 kits at a time.', 'warning');
        return;
      }
      setComparedKits([...comparedKits, kit]);
    }
  };

  const handleAddToCart = (kit) => {
    const medicineObj = {
      id: kit.id,
      name: kit.name,
      genericName: kit.tag,
      category: 'First Aid Kits',
      dosageForm: 'Kit',
      packaging: 'Box',
      tabletsPerSheet: 1,
      stock: 100,
      minStock: 5,
      purchasePrice: kit.price * 0.7,
      sellingPrice: kit.price,
      shelfLocation: 'FA-1',
      expiryDate: '2029-12-31'
    };
    addToCart(medicineObj);
    addNotification(`🛒 ${kit.name} added to cart!`, 'success');
  };

  const handleBuyNow = (kit) => {
    const medicineObj = {
      id: kit.id,
      name: kit.name,
      genericName: kit.tag,
      category: 'First Aid Kits',
      dosageForm: 'Kit',
      packaging: 'Box',
      tabletsPerSheet: 1,
      stock: 100,
      minStock: 5,
      purchasePrice: kit.price * 0.7,
      sellingPrice: kit.price,
      shelfLocation: 'FA-1',
      expiryDate: '2029-12-31'
    };
    addToCart(medicineObj);
    setCurrentTab('shop');
  };

  const getDiscountPercent = (price, mrp) => {
    return Math.round(((mrp - price) / mrp) * 100);
  };

  return (
    <section className="relative space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">First Aid Kits</h2>
          <p className="text-[11px] text-gray-400 font-medium">Professional emergency medical kits for home, travel, and business safety</p>
        </div>
        {comparedKits.length > 0 && (
          <button 
            onClick={() => setShowCompareModal(true)} 
            className="btn-outline btn-sm text-primary-600 bg-primary-50/50 hover:bg-primary-600 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all duration-200"
          >
            <Scale className="w-4 h-4" />
            Compare ({comparedKits.length})
          </button>
        )}
      </div>

      {/* Grid of kits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kitsData.map((kit) => {
          const discount = getDiscountPercent(kit.price, kit.mrp);
          const isExpanded = expandedKit === kit.id;
          const isComparing = comparedKits.some(k => k.id === kit.id);
          const isSaved = wishlist.includes(kit.id);
          const kitMedicine = {
            id: kit.id,
            name: kit.name,
            genericName: kit.tag,
            category: 'First Aid Kits',
            dosageForm: 'Kit',
            packaging: 'Box',
            tabletsPerSheet: 1,
            stock: 100,
            minStock: 5,
            purchasePrice: kit.price * 0.7,
            sellingPrice: kit.price,
            shelfLocation: 'FA-1',
            expiryDate: '2029-12-31'
          };

          return (
            <div key={kit.id} className="card p-4 flex flex-col justify-between relative group overflow-hidden border border-gray-100/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              {/* Badges Container */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                <span className="bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-lg shadow-sm">
                  {discount}% OFF
                </span>
                {kit.badge && (
                  <span className="bg-primary-600 text-white text-[9px] font-bold rounded-lg px-2 py-0.5 flex items-center gap-1 shadow-sm">
                    <Star className="w-2.5 h-2.5 fill-white text-white" />
                    {kit.badge}
                  </span>
                )}
              </div>

              {/* Product Image / Illustration wrapper */}
              <div className="pt-6 pb-4 flex justify-center">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border border-gray-100/50 shadow-sm ${kit.iconColor}`}>
                  {kit.icon}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    {kit.tag}
                  </span>
                  <h3 className="text-sm font-bold text-gray-800 leading-tight pt-1.5 group-hover:text-primary-600 transition-colors">
                    {kit.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {kit.description}
                  </p>
                </div>

                {/* Best For Tags */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Best For:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {kit.bestFor.map((item, idx) => (
                      <span key={idx} className="bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-lg">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Items stats & expandable list */}
                <div className="pt-2 border-t border-dashed border-gray-100 mt-auto">
                  <button 
                    onClick={() => toggleExpand(kit.id)}
                    className="w-full flex items-center justify-between text-xs text-primary-600 font-semibold hover:text-primary-700 hover:underline cursor-pointer"
                  >
                    <span>{kit.totalItems} Premium Items</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      {isExpanded ? (
                        <>Hide <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>View Items <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </span>
                  </button>

                  {/* Expandable items block */}
                  {isExpanded && (
                    <div className="mt-2 p-2 bg-gray-50/80 rounded-xl border border-gray-100 text-[11px] text-gray-600 space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin animate-fade-in">
                      {kit.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing section */}
              <div className="pt-4 space-y-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-gray-800">₹{kit.price}</span>
                  <span className="text-xs text-gray-400 line-through">₹{kit.mrp}</span>
                </div>

                {/* Call to Actions */}
                <div className="space-y-1.5">
                  <button 
                    onClick={() => handleBuyNow(kit)}
                    className="w-full btn-primary btn-sm py-2 rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-transform duration-200"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    Buy Now
                  </button>
                  <QuantitySelector
                    medicine={kitMedicine}
                    cart={cart}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    updateCartQuantity={updateCartQuantity}
                    isFirstAid={true}
                  />
                </div>

                {/* Utility Actions footer */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => toggleWishlist(kit.id)}
                    className={`flex-1 btn-outline btn-sm py-1.5 text-[11px] rounded-lg flex items-center justify-center gap-1 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 ${isSaved ? 'text-rose-600 border-rose-200 bg-rose-50/50' : 'text-gray-500'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button 
                    onClick={() => toggleCompare(kit)}
                    className={`flex-1 btn-outline btn-sm py-1.5 text-[11px] rounded-lg flex items-center justify-center gap-1 ${isComparing ? 'text-primary-600 border-primary-300 bg-primary-50/50 font-bold' : 'text-gray-500'}`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    {isComparing ? 'Selected' : 'Compare'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Compare Bar */}
      {comparedKits.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-gray-200/80 shadow-2xl rounded-2xl py-3 px-5 flex items-center gap-4 animate-slide-up max-w-sm sm:max-w-md w-[90%] justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
              <Scale className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Compare First Aid Kits</p>
              <p className="text-[10px] text-gray-400 font-medium">{comparedKits.length} selected (max 4)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setComparedKits([])}
              className="text-[11px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1"
            >
              Clear
            </button>
            <button 
              onClick={() => setShowCompareModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:shadow-glow-green cursor-pointer transition-all duration-200"
            >
              Compare Now
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal Overlay */}
      {showCompareModal && (
        <div className="modal-overlay z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowCompareModal(false)}>
          <div className="modal-container w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl flex flex-col shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Scale className="w-4.5 h-4.5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">First Aid Kit Comparison</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Compare specifications, items, and recommended use cases</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-4 font-bold text-gray-400 uppercase tracking-wide text-[10px] w-48">Feature</th>
                      {/* If no compared kits, display all 5 by default, otherwise display the selected ones */}
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <th key={kit.id} className="p-4 border-l border-gray-100 min-w-[160px] relative text-center">
                          <div className="text-2xl mb-1">{kit.icon}</div>
                          <p className="font-extrabold text-gray-800 leading-tight">{kit.name}</p>
                          <p className="text-[10px] text-primary-600 font-bold uppercase tracking-wider pt-0.5">{kit.tag}</p>
                          <p className="text-sm font-black text-gray-800 pt-2">₹{kit.price}</p>
                          <button 
                            onClick={() => handleAddToCart(kit)}
                            className="mt-3 bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 transition-all duration-200 w-full justify-center"
                          >
                            <ShoppingCart className="w-3 h-3" /> Add to Cart
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Number of Items</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-bold text-gray-800">
                          {kit.features.itemsCount}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Travel Friendly</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.travel}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Home Use</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.home}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Vehicle Use</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.vehicle}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Office Use</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.office === 'No' ? '✗ No' : `✓ ${kit.features.office}`}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Emergency Level</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.emergency}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Burn Care</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.burn}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">CPR Protection</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.cpr === 'No' ? '✗ No' : `✓ ${kit.features.cpr}`}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Thermometer</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.thermometer === 'No' ? '✗ No' : `✓ ${kit.features.thermometer}`}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">BP Monitor</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.bp === 'No' ? '✗ No' : `✓ ${kit.features.bp}`}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Pulse Oximeter</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.oximeter === 'No' ? '✗ No' : `✓ ${kit.features.oximeter}`}
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-gray-50/40">
                      <td className="p-4 font-semibold text-gray-600 bg-gray-50/30">Survival Accessories</td>
                      {(comparedKits.length > 0 ? comparedKits : kitsData).map(kit => (
                        <td key={kit.id} className="p-4 border-l border-gray-100 text-center font-medium text-gray-700">
                          {kit.features.survival}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowCompareModal(false)} className="btn-outline btn-sm cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
