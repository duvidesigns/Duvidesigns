// ─── Firebase setup ───
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAlvZ8nzjTdFpBw7mFxbMjpiHlTqrHfP6o",
  authDomain: "duvi-designs.firebaseapp.com",
  databaseURL: "https://duvi-designs-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "duvi-designs",
  storageBucket: "duvi-designs.firebasestorage.app",
  messagingSenderId: "290198968741",
  appId: "1:290198968741:web:222a0b01d04f9ae77cf04c"
};
const firebaseApp = initializeApp(firebaseConfig);
export const db = getDatabase(firebaseApp);