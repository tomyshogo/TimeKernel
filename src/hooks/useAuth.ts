import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { subscribeToAuth } from '../services/auth';
import { getOrCreateUser, getUserSettings } from '../services/userService';
import { subscribeToEventQueue } from '../services/eventQueueService';

export function useAuth() {
  const {
    uid, isLoading, isAuthenticated, isNewUser, profile, settings,
    setUid, setLoading, setAuthenticated, setIsNewUser, setProfile, setSettings,
  } = useAuthStore();

  const queueUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      // 前回のキュー監視を解除
      if (queueUnsubRef.current) {
        queueUnsubRef.current();
        queueUnsubRef.current = null;
      }

      if (user) {
        setUid(user.uid);
        setAuthenticated(true);
        try {
          const { profile: userProfile, isNewUser: isNew } = await getOrCreateUser(user.uid);
          setProfile(userProfile);
          setIsNewUser(isNew);
          const userSettings = await getUserSettings(user.uid);
          setSettings(userSettings);
          // MCPキュー監視を開始
          queueUnsubRef.current = subscribeToEventQueue(user.uid);
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

    return () => {
      unsubscribe();
      if (queueUnsubRef.current) queueUnsubRef.current();
    };
  }, []);

  return { uid, isLoading, isAuthenticated, isNewUser, profile, settings };
}
