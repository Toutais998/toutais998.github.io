// 数据管理文件 (Firebase-only)
// 用于集中管理实验室物料数据结构和数据操作功能

import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc, writeBatch, deleteDoc, updateDoc, setDoc, query, where, runTransaction } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { db, storage } from './firebase-config.js';

const FIREBASE_TIMEOUT_MS = 5000; // 5秒超时

function promiseWithTimeout(promise, ms, timeoutError = new Error('Promise timed out')) {
    const timeout = new Promise((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(timeoutError);
        }, ms);
    });
    return Promise.race([promise, timeout]);
}

const ITEMS_COLLECTION = 'lab-items';
const DIRECTORIES_DOC_PATH = "materials/data";
const METADATA_COLLECTION = 'metadata';
const SEED_FLAG_DOC = 'isSeeded';

const directoryStructure = [
    { name: "耗材", id: "consumables", children: [{ name: "光学耗材", id: "optical-consumables" }, { name: "电学耗材", id: "electrical-consumables" }, { name: "其他耗材", id: "other-consumables" },], },
    { name: "仪器设备", id: "instruments", children: [{ name: "光学基本仪器", id: "optical-instruments" }, { name: "光谱学仪器", id: "spectroscopy-instruments" }, { name: "超快光学仪器", id: "ultrafast-optics" }, { name: "采集卡和电脑", id: "daq-and-computers" }, { name: "电学仪器", id: "electrical-instruments" }, { name: "机械设备", id: "mechanical-equipment" }, { name: "激光器", id: "lasers" }, { name: "其他设备", id: "other-instruments" },], },
    { name: "其他", id: "others", children: [] },
];

const defaultItems = [
    { name: "Scan Lens", location: "光学耗材", imageUrl: "images/Material/scan lens.png", quantity: 1, category: "optical-consumables" },
    { name: "三棱镜", location: "光学耗材", imageUrl: "images/Material/三棱镜.png", quantity: 1, category: "optical-consumables" },
    { name: "二向色镜", location: "光学耗材", imageUrl: "images/Material/二向色镜.png", quantity: 1, category: "optical-consumables" },
    { name: "光阑", location: "光学耗材", imageUrl: "images/Material/光阑.png", quantity: 1, category: "optical-consumables" },
    { name: "分光平片", location: "光学耗材", imageUrl: "images/Material/分光平片.png", quantity: 1, category: "optical-consumables" },
    { name: "分光棱镜", location: "光学耗材", imageUrl: "images/Material/分光棱镜.png", quantity: 1, category: "optical-consumables" },
    { name: "回射棱镜", location: "光学耗材", imageUrl: "images/Material/回射棱镜.png", quantity: 1, category: "optical-consumables" },
    { name: "波片", location: "光学耗材", imageUrl: "images/Material/波片.png", quantity: 1, category: "optical-consumables" },
    { name: "滤光片", location: "光学耗材", imageUrl: "images/Material/滤光片.png", quantity: 1, category: "optical-consumables" },
    { name: "物镜", location: "光学耗材", imageUrl: "images/Material/物镜.png", quantity: 1, category: "optical-consumables" },
    { name: "离轴抛面镜", location: "光学耗材", imageUrl: "images/Material/离轴抛面镜.png", quantity: 1, category: "optical-consumables" },
    { name: "银膜反射镜", location: "光学耗材", imageUrl: "images/Material/银膜反射镜.png", quantity: 1, category: "optical-consumables" },
    { name: "偏振分光棱镜", location: "光学耗材", imageUrl: "images/Material/偏振分光棱镜.png", quantity: 1, category: "optical-consumables" },
    { name: "BNC", location: "电学耗材", imageUrl: "images/Material/BNC.png", quantity: 1, category: "electrical-consumables" },
    { name: "SMA", location: "电学耗材", imageUrl: "images/Material/sma.png", quantity: 1, category: "electrical-consumables" },
    { name: "光电二极管", location: "电学耗材", imageUrl: "images/Material/光电二极管.png", quantity: 1, category: "electrical-consumables" },
    { name: "扩束镜", location: "光学基本仪器", imageUrl: "images/Material/扩束镜.png", quantity: 1, category: "optical-instruments" },
    { name: "Thorlabs CCD光谱仪", location: "光谱学仪器", imageUrl: "images/Material/thorlabs CCD光谱仪.png", quantity: 1, category: "spectroscopy-instruments" },
    { name: "复享光谱仪", location: "光谱学仪器", imageUrl: "images/Material/复享光谱仪.png", quantity: 1, category: "spectroscopy-instruments" },
    { name: "超快反射镜", location: "超快光学仪器", imageUrl: "images/Material/超快反射镜.png", quantity: 1, category: "ultrafast-optics" },
    { name: "凹面谐振腔", location: "超快光学仪器", imageUrl: "images/Material/凹面谐振腔.png", quantity: 1, category: "ultrafast-optics" },
    { name: "Acqiris采集卡", location: "采集卡和电脑", imageUrl: "images/Material/acqiris采集卡.png", quantity: 1, category: "daq-and-computers" },
    { name: "BH采集卡", location: "采集卡和电脑", imageUrl: "images/Material/bh采集卡.png", quantity: 1, category: "daq-and-computers" },
    { name: "vDAQ", location: "采集卡和电脑", imageUrl: "images/Material/vdaq.png", quantity: 1, category: "daq-and-computers" },
    { name: "台式电脑", location: "采集卡和电脑", imageUrl: "images/Material/台式电脑.png", quantity: 1, category: "daq-and-computers" },
    { name: "keysight示波器", location: "电学仪器", imageUrl: "images/Material/Keysight示波器.png", quantity: 1, category: "electrical-instruments" },
    { name: "光学平台", location: "机械设备", imageUrl: "images/Material/光学平台.png", quantity: 1, category: "mechanical-equipment" },
    { name: "激光器", location: "激光器", imageUrl: "images/Material/激光器.png", quantity: 1, category: "lasers" },
    { name: "郎研激光器", location: "激光器", imageUrl: "images/Material/郎研激光.png", quantity: 1, category: "lasers" },
    { name: "安扬连续光", location: "激光器", imageUrl: "images/Material/安扬连续光.jpg", quantity: 1, category: "lasers" },
    { name: "NKT连续光", location: "激光器", imageUrl: "images/Material/NKT连续光.jpg", quantity: 1, category: "lasers" },
    { name: "50.8透镜", location: "其他设备", imageUrl: "images/Material/50.8透镜.png", quantity: 1, category: "other-instruments" },
    { name: "25.4透镜", category: "其他", location: "大光学实验室", imageUrl: "images/Material/25.4透镜.png", quantity: 1, category: "others" },
];

export async function seedDatabaseIfEmpty() {
    const seedFlagRef = doc(db, METADATA_COLLECTION, SEED_FLAG_DOC);
    try {
        let seeded = false;
        await promiseWithTimeout(
            runTransaction(db, async (transaction) => {
                const seedFlagDoc = await transaction.get(seedFlagRef);
                if (seedFlagDoc.exists()) {
                    console.log("Database has already been seeded. Skipping.");
                    return;
                }
                console.log("Database is empty. Seeding with default data...");
                const itemsCollection = collection(db, ITEMS_COLLECTION);
                defaultItems.forEach(item => {
                    const docRef = doc(itemsCollection);
                    transaction.set(docRef, { ...item, createdAt: serverTimestamp() });
                });
                const directoriesDocRef = doc(db, DIRECTORIES_DOC_PATH);
                transaction.set(directoriesDocRef, { directories: directoryStructure });
                transaction.set(seedFlagRef, { seededAt: serverTimestamp() });
                seeded = true; // Mark that seeding happened
            }),
            FIREBASE_TIMEOUT_MS
        );
        return seeded; // Return whether seeding was performed
    } catch (error) {
        console.error("Error in seeding transaction: ", error);
        return false;
    }
}

export async function fetchItems(categoryId = 'all') {
    try {
        const itemsCollection = collection(db, ITEMS_COLLECTION);
        const q = categoryId === 'all' ? query(itemsCollection) : query(itemsCollection, where("category", "==", categoryId));
        const querySnapshot = await promiseWithTimeout(getDocs(q), FIREBASE_TIMEOUT_MS);
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    } catch (error) {
        console.error(`Error fetching items for category ${categoryId}: `, error);
        return [];
    }
}

async function uploadImage(imageFile) {
    if (!imageFile) return null;
    const storageRef = ref(storage, `item-images/${Date.now()}_${imageFile.name}`);
    try {
        const snapshot = await uploadBytes(storageRef, imageFile);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading image: ", error);
        return null;
    }
}

export async function addItem(itemData) {
    try {
        const imageUrl = await uploadImage(itemData.imageFile);
        const itemPayload = {
            name: itemData.name,
            quantity: itemData.quantity,
            location: itemData.location,
            category: itemData.category,
            createdAt: serverTimestamp()
        };
        if (imageUrl) itemPayload.imageUrl = imageUrl;

        const docRef = await addDoc(collection(db, ITEMS_COLLECTION), itemPayload);
        return { id: docRef.id, ...itemPayload, createdAt: new Date() };
    } catch (e) {
        console.error("Error adding document: ", e);
        return null;
    }
}

export async function fetchDirectoryStructure() {
    const docRef = doc(db, DIRECTORIES_DOC_PATH);
    try {
        const docSnap = await promiseWithTimeout(getDoc(docRef), FIREBASE_TIMEOUT_MS);
        if (docSnap.exists() && docSnap.data().directories) {
            return docSnap.data().directories;
        }
        return JSON.parse(JSON.stringify(directoryStructure));
    } catch (error) {
        console.error("Error fetching directory structure: ", error);
        return JSON.parse(JSON.stringify(directoryStructure));
    }
}

export async function saveDirectoryStructure(directories) {
    try {
        await setDoc(doc(db, DIRECTORIES_DOC_PATH), { directories });
        return true;
    } catch (error) {
        console.error("Error saving directory structure: ", error);
        return false;
    }
}

export async function updateItem(itemId, updatedData) {
    try {
        await updateDoc(doc(db, ITEMS_COLLECTION, itemId), updatedData);
        return true;
    } catch (error) {
        console.error("Error updating item: ", error);
        return false;
    }
}

export async function deleteItem(itemId) {
    try {
        await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
        return true;
    } catch (error) {
        console.error("Error deleting item: ", error);
        return false;
    }
} 