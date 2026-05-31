// 🔥 Firebase Configuration — Jungle Park
//
// SETUP INSTRUCTIONS:
// 1. Go to https://firebase.google.com
// 2. Click "Get Started" → Create a new project (name it "jungle-park")
// 3. In project console, click "Add app" → choose Web (</>)
// 4. Register app, then copy the firebaseConfig values below
// 5. In Firebase console, enable:
//    - Authentication → Sign-in methods → Anonymous ✅
//    - Firestore Database → Create in test mode ✅
//    - Realtime Database → Create in test mode ✅
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDX7MXDErVKvDOtJMGoAujDdAi--wUV6B4",
  authDomain: "jungle-park-164e4.firebaseapp.com",
  // ⚠️ Required for Realtime Database — go to Firebase Console →
  // Realtime Database → Copy the URL shown at the top of the page
  databaseURL: "https://jungle-park-164e4-default-rtdb.firebaseio.com",
  projectId: "jungle-park-164e4",
  storageBucket: "jungle-park-164e4.firebasestorage.app",
  messagingSenderId: "790290290631",
  appId: "1:790290290631:web:7b6cadb524f47631a8ebe2",
};

const app = initializeApp(firebaseConfig);

const authInstance = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export const auth = authInstance;
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export default app;
