// Firebase配置文件
// 用于集中管理Firebase相关配置和初始化功能

// Import the functions you need from the SDKs you need
// Note: These are now available globally from the scripts imported in the HTML
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Firebase配置信息
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

const directoriesDocRef = doc(db, "materials", "data");

/**
 * Loads the directories structure from Firestore.
 * @returns {Promise<Array|null>} The directories array, or null if not found.
 */
export async function loadDirectoriesFromFirebase() {
    try {
        const docSnap = await getDoc(directoriesDocRef);
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            return docSnap.data().directories;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting document:", error);
        throw error;
    }
}

/**
 * Saves the entire directories structure to Firestore.
 * @param {Array} directories The directories array to save.
 */
export async function saveDirectoriesToFirebase(directories) {
    try {
        await setDoc(directoriesDocRef, { directories });
        console.log("Document successfully written!");
    } catch (error) {
        console.error("Error writing document: ", error);
        throw error;
    }
}

// 导出Firebase初始化函数
export async function initializeFirebase() {
    try {
        // 动态导入Firebase模块
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js");
        // const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");

        // 初始化Firebase应用
        app = initializeApp(firebaseConfig);
        // analytics = getAnalytics(app);
        db = getFirestore(app);

        console.log("Firebase 应用已初始化:", app);
        console.log("Firestore 实例已获取:", db);

        return { app, db };
    } catch (error) {
        console.error("Firebase初始化失败:", error);
        return { error };
    }
}

// 导出Firestore操作函数
export async function getFirestoreModules() {
    try {
        const {
            doc,
            getDoc,
            setDoc,
            collection,
            deleteDoc
        } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");

        return { doc, getDoc, setDoc, collection, deleteDoc };
    } catch (error) {
        console.error("Firestore模块导入失败:", error);
        return { error };
    }
}

export { db, storage }; 