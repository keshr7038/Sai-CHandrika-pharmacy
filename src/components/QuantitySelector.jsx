import React, { useMemo } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';

export default function QuantitySelector({ 
  medicine, 
  cart, 
  addToCart, 
  removeFromCart, 
  updateCartQuantity,
  isFirstAid = false 
}) {
  const cartItem = useMemo(() => cart.find(item => item.medicineId === medicine.id), [cart, medicine.id]);
  const qty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = medicine.stock <= 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(medicine);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (qty < medicine.stock) {
      updateCartQuantity(medicine.id, qty + 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (qty === 1) {
      removeFromCart(medicine.id);
    } else {
      updateCartQuantity(medicine.id, qty - 1);
    }
  };

  if (isOutOfStock) {
    return (
      <span className="w-full text-center py-2 px-4 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200/50 select-none block">
        Out of Stock
      </span>
    );
  }

  return (
    <div className="relative overflow-hidden w-full h-[36px] flex items-center justify-center transition-all duration-300">
      {qty > 0 ? (
        // Quantity Selector State
        <div className="w-full h-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-1 animate-scale-in">
          <button
            onClick={handleDecrement}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50 transition-colors font-bold text-lg select-none cursor-pointer"
            type="button"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-extrabold text-sm text-gray-800 font-mono flex-1 text-center select-none">
            {qty}
          </span>
          <button
            onClick={handleIncrement}
            disabled={qty >= medicine.stock}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50 transition-colors font-bold text-lg select-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            type="button"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        // Add to Cart Button State
        <button
          onClick={handleAdd}
          className={`w-full h-full btn-primary py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-[0.97] hover:shadow-sm ${
            isFirstAid 
              ? 'text-primary-600 bg-primary-50/50 border border-primary-200/60 hover:bg-primary-600 hover:text-white' 
              : ''
          }`}
          type="button"
        >
          {isFirstAid ? <ShoppingCart className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isFirstAid ? 'Add to Cart' : 'Add'}</span>
        </button>
      )}
    </div>
  );
}
