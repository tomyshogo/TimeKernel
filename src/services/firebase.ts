import { initializeApp } from 'firebase/app';
// @ts-expect-error -- Metro resolves firebase/auth to the RN entry which exports getReactNativePersistence
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCcQeBTzaf6pHtT0gH-whqvXtzwvhBjohI',
  authDomain: 'timekernel.firebaseapp.com',
  projectId: 'timekernel',
  storageBucket: 'timekernel.firebasestorage.app',
  messagingSenderId: '96713704891',
  appId: '1:96713704891:web:93751dbdc4b6e1a2e6f09e',
  measurementId: 'G-RW6CJ8P3LY',
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// React NativeではIndexedDBが使えないのでメモリキャッシュを使用
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});
