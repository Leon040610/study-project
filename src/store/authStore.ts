import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  login: (user, token) => set({ user, token, isLoggedIn: true }),
  logout: () => set({ user: null, token: null, isLoggedIn: false }),
  setUser: (user) => set({ user }),
}));
