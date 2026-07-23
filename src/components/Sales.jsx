import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Receipt, Search, Pill, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import QuantitySelector from './QuantitySelector';

const CATEGORIES = [
  'All',
  'Analgesics',
  'Antibiotics',
  'Cardiology',
  'Diabetes',
  'First Aid',
  'Gastrointestinal',
  'Respiratory',
  'Vitamins',
  'Others',
];

export default function Sales() {
  const {
    user,
    medicines,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
  } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Filter medicines based on search and selected category
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const matchesSearch =
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'All' || med.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchQuery, activeCategory]);

  const getCartQty = (medId) => {
    const item = cart.find((c) => c.medicineId === medId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary-600" />
            {user?.role === 'customer' ? 'Shop Medicines' : 'POS Billing Terminal'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'customer' 
              ? 'Browse our extensive catalog, adjust quantities, and pay via secure UPI' 
              : 'Search products, add them to the billing cart from the top navbar, and generate checkout receipts'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="badge-info">
            <Pill className="w-3.5 h-3.5 mr-1" />
            {medicines.length} Products Available
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-12 gap-6">
        {/* Medicine Catalog - Full Screen 12 columns */}
        <div className="col-span-12 space-y-5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines by name, generic description, or category..."
              className="input pl-11 py-3 text-sm focus:ring-2 focus:ring-primary-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Categories Tab Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {cat === 'All' && <Filter className="w-3 h-3" />}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          {filteredMedicines.length === 0 ? (
            <div className="card text-center py-16 bg-white border border-gray-100">
              <Pill className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">No medicines found</h3>
              <p className="text-xs text-gray-400 mt-1">
                Try adjusting your search terms or selecting another category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredMedicines.map((med) => {
                const isOutOfStock = med.stock === 0;
                const isLowStock = med.stock > 0 && med.stock <= med.minStock;
                const inCartQty = getCartQty(med.id);

                return (
                  <div
                    key={med.id}
                    className={`card bg-white border border-gray-100 p-5 flex flex-col justify-between hover:shadow-lg hover:border-gray-200 transition-all duration-300 ${
                      isOutOfStock ? 'opacity-65' : ''
                    }`}
                  >
                    <div>
                      {/* Badge / Category */}
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {med.category}
                        </span>
                        {inCartQty > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-3 h-3" /> {inCartQty} in cart
                          </span>
                        )}
                      </div>

                      {/* Title & Generic Name */}
                      <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">
                        {med.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium italic mt-1 line-clamp-1">
                        {med.genericName || 'No generic definition'}
                      </p>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pb-4 border-b border-gray-50 text-[11px] text-gray-500">
                        <div>
                          <span className="text-gray-400 block">Form / Pack</span>
                          <span className="font-semibold text-gray-700">{med.dosageForm} • {med.packaging}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-right">Location</span>
                          <span className="font-semibold text-gray-700 block text-right">{med.shelfLocation || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-1 space-y-4">
                      {/* Price & Stock status */}
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase tracking-wide">Retail Price</span>
                          <span className="text-base font-black text-gray-800">
                            ₹{med.sellingPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
                              OUT OF STOCK
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                              LOW STOCK ({med.stock})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full">
                              Stock: {med.stock}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Selector / Add to Cart Button */}
                      <div>
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="btn-primary w-full justify-center py-2.5 text-xs bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
                          >
                            OUT OF STOCK
                          </button>
                        ) : (
                          <QuantitySelector
                            medicine={med}
                            cart={cart}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            updateCartQuantity={updateCartQuantity}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
