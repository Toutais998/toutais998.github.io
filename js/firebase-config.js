// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Your web app's Firebase configuration from the screenshot
const firebaseConfig = {
    apiKey: "AIzaSyAdsyT0NuoqjbWcyiCLdSiQIDdoM7RnGo4",
    authDomain: "yanglab-e8ebe.firebaseapp.com",
    projectId: "yanglab-e8ebe",
    storageBucket: "yanglab-e8ebe.firebasestorage.app",
    messagingSenderId: "746435928321",
    appId: "1:746435928321:web:615c2a9c650c5b38953b00",
    measurementId: "G-SE9HBFS1PW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage }; 