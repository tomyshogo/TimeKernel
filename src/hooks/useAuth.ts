import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { subscribeToAuth } from '../services/auth';
import { getOrCreateUser, getUserSettings } from '../services/userService';

export function useAuth() {
  const {
    uid, isLoading, isAuthenticated, isNewUser, profile, settings,
    setUid, setLoading, setAuthenticated, setIsNewUser, setProfile, setSettings,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (user) {
        setUid(user.uid);
        setAuthenticated(true);
        try {
          const { profile: userProfile, isNewUser: isNew } = await getOrCreateUser(user.uid);
          setProfile(userProfile);
          setIsNewUser(isNew);
          const userSettings = await getUserSettings(user.uid);
          setSettings(userSettings);
        } catch (error) {
          console.warn('Failed to load user data:', error);
          setIsNewUser(true);
        }
      } else {
        setUid(null);
        setAuthenticated(false);
        setProfile(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { uid, isLoading, isAuthenticated, isNewUser, profile, settings };
}
