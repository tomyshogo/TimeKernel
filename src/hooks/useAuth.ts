import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { subscribeToAuth, signInAnonymous } from '../services/auth';
import { getOrCreateUser, getUserSettings } from '../services/userService';

export function useAuth() {
  const {
    uid, isLoading, isNewUser, profile, settings,
    setUid, setLoading, setIsNewUser, setProfile, setSettings,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      if (user) {
        setUid(user.uid);
        const { profile: userProfile, isNewUser: isNew } = await getOrCreateUser(user.uid);
        setProfile(userProfile);
        setIsNewUser(isNew);
        const userSettings = await getUserSettings(user.uid);
        setSettings(userSettings);
      } else {
        await signInAnonymous();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { uid, isLoading, isNewUser, profile, settings };
}
