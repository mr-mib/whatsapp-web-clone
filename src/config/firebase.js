// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBn1nkms_I_NAFjw8UkzjX4DzNfBGs7o6E",
  authDomain: "whatsapp-web-clone-e8db0.firebaseapp.com",
  projectId: "whatsapp-web-clone-e8db0",
  storageBucket: "whatsapp-web-clone-e8db0.firebasestorage.app",
  messagingSenderId: "754911732038",
  appId: "1:754911732038:web:7180c6c197fabfd561c547",
  measurementId: "G-P27PHH0GZG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);

// Exportez les services que vous utiliserez

export const auth = getAuth(app);

export const storage = getStorage(app);

export default app;
