// Auth Service — Firebase Authentication
import {
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Sign in as Guest (anonymous)
export const signInAsGuest = async (guestName, avatarId) => {
  const cred = await signInAnonymously(auth);
  const user = cred.user;
  await createOrUpdateProfile(user.uid, {
    name: guestName || 'Guest Player',
    avatarId: avatarId || 1,
    isGuest: true,
  });
  return user;
};

// Create or update Firestore user profile
export const createOrUpdateProfile = async (uid, data) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      name: data.name,
      avatarId: data.avatarId || 1,
      isGuest: data.isGuest || false,
      stats: { wins: 0, losses: 0, gamesPlayed: 0 },
      createdAt: serverTimestamp(),
    });
  } else {
    // Update name/avatar if provided
    await setDoc(ref, { name: data.name, avatarId: data.avatarId }, { merge: true });
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

// Sign out
export const signOut = () => firebaseSignOut(auth);

// Listen to auth state changes
export const listenAuthState = (callback) => onAuthStateChanged(auth, callback);
