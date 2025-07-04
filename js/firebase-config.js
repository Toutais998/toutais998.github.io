/**
 * ======================================================================
 * * 文件名: js/firebase-config.js
 * * 版本: V2.2
 * * 创建日期: 2024-06-10
 * * 最后修改: 2025-07-05
 * *
 * * 功能简介:
 * * - Firebase 配置和初始化模块。
 * * - 统一导出所有页面需要使用的Firebase服务实例和函数。
 * * - V2.2 修复: 修正了V2.1中引入的语法错误。`import` 语句不支持模板字符串，
 * *   已将导入路径改回静态字符串URL。
 * *
 * * 关键依赖:
 * * - Firebase SDK (通过CDN加载)
 * ======================================================================
 */

// 使用 Firebase CDN URL 导入，适用于直接在浏览器中运行的静态页面
// 注意: import from 后面必须是静态字符串，不能是模板字符串。
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction, addDoc, query, where, serverTimestamp, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// 4. 您的 Firebase 项目配置信息
const firebaseConfig = {
    apiKey: "AIzaSyAdsyT0NuoqjbWcyiCLdSiQIDdoM7RnGo4",
    authDomain: "yanglab-e8ebe.firebaseapp.com",
    projectId: "yanglab-e8ebe",
    storageBucket: "yanglab-e8ebe.firebasestorage.app",
    messagingSenderId: "746435928321",
    appId: "1:746435928321:web:615c2a9c650c5b38953b00",
    measurementId: "G-SE9HBFS1PW"
};

// 5. 初始化 Firebase 服务并导出
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// 6. 统一导出所有服务实例和函数，供其他模块使用
export {
    db,
    storage,
    auth,
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    runTransaction,
    query,
    where,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
}; 