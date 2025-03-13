import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2LNv__u0DqLmG9bZ1Cu_SURPk4StkjUk",
  authDomain: "wallpapers-17b71.firebaseapp.com",
  projectId: "wallpapers-17b71",
  storageBucket: "wallpapers-17b71.appspot.com",
  messagingSenderId: "601668810320",
  appId: "1:601668810320:web:7e527c2cb7236994790355",
  measurementId: "G-49HHGZGTPG",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
