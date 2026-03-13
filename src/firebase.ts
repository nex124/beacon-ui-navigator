// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // This is the 'db' you'll use everywhere

// 3. The Fetcher Function (Step 1)
export const getSKUDetails = async (skuId: string) => {
  try {
    // We use the 'db' we just initialized above
    const docRef = doc(db, "inventory", skuId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Master data found:", docSnap.data());
      return docSnap.data();
    } else {
      console.warn("SKU not found in Firestore:", skuId);
      return { error: "SKU not found" };
    }
  } catch (error) {
    console.error("Firestore Error:", error);
    return { error: "Database connection failed" };
  }
};
