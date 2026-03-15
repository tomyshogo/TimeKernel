import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { subscribeToAuth, signInAnonymous } from '../services/auth';
import { getOrCreateUser, getUserSettings } from '../services/userService';

export function useAuth() {
  const { uid, isLoading, profile, settings, setUid, setLoading, setProfile, setSettings } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (user) {
        setUid(user.uid);
        const userProfile = await getOrCreateUser(user.uid);
        setProfile(userProfile);
        const userSettings = await getUserSettings(user.uid);
        setSettings(userSettings);
      } else {
        await signInAnonymous();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { uid, isLoading, profile, settings };
}
