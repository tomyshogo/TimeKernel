import { create } from 'zustand';
import { UserProfile, UserSettings } from '../types';
import { DEFAULT_PERIODS } from '../types/timetable';
import { DEFAULT_NIGHT_SHIFT, DEFAULT_NOTIFICATION_SETTINGS } from '../types/user';
import { DEFAULT_WEATHER_SETTINGS } from '../types/weather';

interface AuthState {
  uid: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  profile: UserProfile | null;
  settings: UserSettings;
  setUid: (uid: string | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setIsNewUser: (isNew: boolean) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSettings: (settings: UserSettings) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  isLoading: true,
  isAuthenticated: false,
  isNewUser: false,
  profile: null,
  settings: {
    periods: DEFAULT_PERIODS,
    nightShift: DEFAULT_NIGHT_SHIFT,
    notifications: DEFAULT_NOTIFICATION_SETTINGS,
    weather: DEFAULT_WEATHER_SETTINGS,
  },
  setUid: (uid) => set({ uid }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsNewUser: (isNewUser) => set({ isNewUser }),
  setProfile: (profile) => set({ profile }),
  setSettings: (settings) => set({ settings }),
}));
