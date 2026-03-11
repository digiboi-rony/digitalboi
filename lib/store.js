import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      shop: null,
      token: null,
      lang: 'bn',
      setAuth: (user, shop, token) => set({ user, shop, token }),
      setLang: (lang) => set({ lang }),
      logout: () => set({ user: null, shop: null, token: null }),
    }),
    { name: 'digiboi-auth' }
  )
);

// Cart store (POS)
export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  paymentMethod: 'cash',
  customerId: null,

  addItem: (product, qty = 1) => {
    const items = get().items;
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      set({ items: items.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i) });
    } else {
      set({ items: [...items, { ...product, qty }] });
    }
  },

  removeItem: (productId) => set({ items: get().items.filter(i => i.id !== productId) }),

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter(i => i.id !== productId) });
    } else {
      set({ items: get().items.map(i => i.id === productId ? { ...i, qty } : i) });
    }
  },

  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCustomer: (id) => set({ customerId: id }),

  getSubtotal: () => get().items.reduce((s, i) => s + i.selling_price * i.qty, 0),
  getTotal: () => get().items.reduce((s, i) => s + i.selling_price * i.qty, 0) - get().discount,

  clearCart: () => set({ items: [], discount: 0, paymentMethod: 'cash', customerId: null }),
}));

// Notification store
export const useNotifStore = create((set) => ({
  notifications: [],
  addNotif: (msg, type = 'success') => {
    const id = Date.now();
    set(s => ({ notifications: [...s.notifications, { id, msg, type }] }));
    setTimeout(() => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })), 3500);
  },
}));
