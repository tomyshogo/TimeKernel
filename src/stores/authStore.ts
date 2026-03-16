import { create } from 'zustand';
import { UserProfile, UserSettings } from '../types';
import { DEFAULT_PERIODS } from '../types/timetable';
import { DEFAULT_NIGHT_SHIFT, DEFAULT_NOTIFICATION_SETTINGS } from '../types/user';

interface AuthState {
  uid: string | null;
  isLoading: boolean;
  isNewUser: boolean;
  profile: UserProfile | null;
  settings: UserSettings;
  setUid: (uid: string | null) => void;
  setLoading: (loading: boolean) => void;
  setIsNewUser: (isNew: boolean) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSettings: (settings: UserSettings) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  isLoading: true,
  isNewUser: false,
  profile: null,
  settings: {
    periods: DEFAULT_PERIODS,
    nightShift: DEFAULT_NIGHT_SHIFT,
    notifications: DEFAULT_NOTIFICATION_SETTINGS,
  },
  setUid: (uid) => set({ uid }),
  setLoading: (isLoading) => set({ isLoading }),
  setIsNewUser: (isNewUser) => set({ isNewUser }),
  setProfile: (profile) => set({ profile }),
  setSettings: (settings) => set({ settings }),
}));
