import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // <-- NEW: Imports the database tool

const firebaseConfig = {
  apiKey: 'AIzaSyCXhIeQ1vkPtmhdz_2E46Lwt31w0_DW2_o',
  authDomain: 'edivy-content-crm.firebaseapp.com',
  projectId: 'edivy-content-crm',
  storageBucket: 'edivy-content-crm.firebasestorage.app',
  messagingSenderId: '837876081934',
  appId: '1:837876081934:web:8474f4c53ceda654dc235f',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // <-- NEW: Exports the database so your Planner can use it
