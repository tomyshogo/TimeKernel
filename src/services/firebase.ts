import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enablePersistentCacheIndexAutoCreation,
  getPersistentCacheIndexManager,
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
export const auth = getAuth(app);

// Firestoreオフラインパーシステンス有効化
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// オフライン時のクエリパフォーマンス向上のため自動インデックス作成を有効化
const indexManager = getPersistentCacheIndexManager(db);
if (indexManager) {
  enablePersistentCacheIndexAutoCreation(indexManager);
}
