import { create } from "zustand";
import type { User } from "@shared/schema";
import { authApi } from "@/lib/api";
import { useCartStore } from "./cartStore";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authInitialized: boolean;
  
  // Actions
  login: (user: User) => void;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  authInitialized: false,

  login: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      authInitialized: true,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      useCartStore.getState().clear();
      
      set({
        user: null,
        isAuthenticated: false,
        authInitialized: true,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  checkAuth: async () => {
    // httpOnly cookies недоступны для document.cookie, поэтому просто вызываем API
    try {
      const { user } = await authApi.me();
      set({
        user,
        isAuthenticated: true,
        authInitialized: true,
      });
    } catch (error) {
      // Токен невалиден или отсутствует → сбросить состояние
      set({
        user: null,
        isAuthenticated: false,
        authInitialized: true,
      });
    }
  },
}));
