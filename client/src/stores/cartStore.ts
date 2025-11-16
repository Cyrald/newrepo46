import { create } from "zustand";
import type { CartItemWithProduct } from "@shared/schema";

interface CartState {
  items: CartItemWithProduct[];
  itemCount: number;
  total: number;
  
  // Actions
  setItems: (items: CartItemWithProduct[]) => void;
  addItem: (item: CartItemWithProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  calculateTotals: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  total: 0,

  setItems: (items: CartItemWithProduct[]) => {
    set({ items });
    get().calculateTotals();
  },

  addItem: (item: CartItemWithProduct) => {
    const existingItem = get().items.find((i) => i.productId === item.productId);
    
    if (existingItem) {
      get().updateQuantity(item.productId, existingItem.quantity + item.quantity);
    } else {
      set({ items: [...get().items, item] });
      get().calculateTotals();
    }
  },

  removeItem: (productId: string) => {
    set({
      items: get().items.filter((item) => item.productId !== productId),
    });
    get().calculateTotals();
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 0) {
      console.error(`[Cart] Invalid quantity: ${quantity}`);
      return;
    }

    if (quantity === 0) {
      get().removeItem(productId);
      return;
    }

    const item = get().items.find((i) => i.productId === productId);
    if (item?.product?.stockQuantity !== undefined && quantity > item.product.stockQuantity) {
      console.error(`[Cart] Cannot set quantity ${quantity} - exceeds stock ${item.product.stockQuantity} for ${item.product.name}`);
      return;
    }

    set({
      items: get().items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    });
    get().calculateTotals();
  },

  clear: () => {
    set({
      items: [],
      itemCount: 0,
      total: 0,
    });
  },

  calculateTotals: () => {
    const items = get().items;
    let hasErrors = false;
    
    const itemCount = items.reduce((sum, item) => {
      if (typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        console.error(`[Cart] Invalid quantity for item ${item.productId}:`, item.quantity);
        hasErrors = true;
        return sum;
      }
      return sum + item.quantity;
    }, 0);
    
    const total = items.reduce((sum, item) => {
      if (!item.product) {
        console.warn(`[Cart] Item ${item.id} missing product data`);
        hasErrors = true;
        return sum;
      }
      
      if (!item.product.price) {
        console.error(`[Cart] Item ${item.product.id} (${item.product.name}) missing price`);
        hasErrors = true;
        return sum;
      }
      
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price) 
        : Number(item.product.price);
      
      if (isNaN(price) || price < 0) {
        console.error(`[Cart] Invalid price for ${item.product.name}: ${item.product.price}`);
        hasErrors = true;
        return sum;
      }
      
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        return sum;
      }
      
      return sum + (price * item.quantity);
    }, 0);

    if (hasErrors) {
      console.warn('[Cart] Errors detected during total calculation. Some items may not be included.');
    }

    set({ itemCount, total: Math.max(0, total) });
  },
}));
