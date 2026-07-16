import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
// ఇక్కడ కాంప్లెక్స్ క్యాచ్ తీసేసి, సింపుల్ గా మార్చాను
const db = getFirestore(app); 
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
import { getMessaging, getToken, onMessage } from "firebase/messaging";

export const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE' });
      console.log('Token:', token);
    }
  } catch (error) {
    console.error("Permission denied", error);
  }
};
