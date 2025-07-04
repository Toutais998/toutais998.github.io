/* 
=====================================================================
* 文件名: firebase-config.js
* 版本: V1.1
* 创建日期: 未知
* 最后修改: 2025-07-05
* 
* 本次更新:
* - 版本号更新 (V1.0 -> V1.1)
* - 将所有 Firebase SDK 的导入方式从 URL 改为从 NPM 包导入。
* - 导出了所有需要用到的 Firestore 和 Storage 函数。
* 
* 功能简介:
* - 初始化 Firebase 应用的核心配置文件。
* - 包含了连接到您 Firebase 项目的所有必要凭据。
* - 初始化并导出 Firestore 数据库 (db) 和 Storage (storage) 的实例。
* - 统一导出所有其他页面需要用到的 Firebase 函数，作为项目的官方 Firebase SDK 入口。
=====================================================================
*/

// 1. 从 NPM 包导入 Firebase 应用初始化函数
import { initializeApp } from "firebase/app";

// 2. 从 NPM 包导入所有需要用到的 Firestore 函数
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    writeBatch,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    runTransaction
} from "firebase/firestore";

// 3. 从 NPM 包导入所有需要用到的 Storage 函数
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

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

// 6. 统一导出所有服务实例和函数，供其他模块使用
export {
    db,
    storage,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    writeBatch,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    runTransaction
}; 