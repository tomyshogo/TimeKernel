import {
  signInAnonymously,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  linkWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

export async function signInAnonymous(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function sendEmailLink(email: string): Promise<void> {
  const actionCodeSettings = {
    url: 'https://timekernel.page.link/login',
    handleCodeInApp: true,
    iOS: { bundleId: 'com.timekernel.app' },
    android: {
      packageName: 'com.timekernel.app',
      installApp: true,
    },
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
}

export async function completeEmailLink(
  email: string,
  link: string
): Promise<User | null> {
  if (!isSignInWithEmailLink(auth, link)) return null;

  const currentUser = auth.currentUser;
  if (currentUser?.isAnonymous) {
    const credential = EmailAuthProvider.credentialWithLink(email, link);
    const result = await linkWithCredential(currentUser, credential);
    return result.user;
  }

  const result = await signInWithEmailLink(auth, email, link);
  return result.user;
}

export function subscribeToAuth(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
