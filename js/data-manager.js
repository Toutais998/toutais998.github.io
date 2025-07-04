// 数据管理文件
// 用于集中管理实验室物料数据结构和数据操作功能

import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc, writeBatch, deleteDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { db } from './firebase-config.js';

const ITEMS_COLLECTION = 'lab-items';
const DIRECTORIES_DOC_PATH = "materials/data";

const directoryStructure = [
    {
        name: "耗材", id: "consumables",
        children: [
            { name: "光学耗材", id: "optical-consumables" },
            { name: "电学耗材", id: "electrical-consumables" },
            { name: "其他耗材", id: "other-consumables" },
        ],
    },
    {
        name: "仪器设备", id: "instruments",
        children: [
            { name: "光学基本仪器", id: "optical-instruments" },
            { name: "光谱学仪器", id: "spectroscopy-instruments" },
            { name: "超快光学仪器", id: "ultrafast-optics" },
            { name: "采集卡和电脑", id: "daq-and-computers" },
            { name: "电学仪器", id: "electrical-instruments" },
            { name: "机械设备", id: "mechanical-equipment" },
            { name: "激光器", id: "lasers" },
            { name: "其他设备", id: "other-instruments" },
        ],
    },
    { name: "其他", id: "others", children: [] },
];

const defaultItems = [
    { name: "Scan Lens", location: "光学耗材", imageUrl: "images/Material/scan lens.png", quantity: 1 },
    { name: "三棱镜", location: "光学耗材", imageUrl: "images/Material/三棱镜.png", quantity: 1 },
    { name: "二向色镜", location: "光学耗材", imageUrl: "images/Material/二向色镜.png", quantity: 1 },
    { name: "光阑", location: "光学耗材", imageUrl: "images/Material/光阑.png", quantity: 1 },
    { name: "分光平片", location: "光学耗材", imageUrl: "images/Material/分光平片.png", quantity: 1 },
    { name: "分光棱镜", location: "光学耗材", imageUrl: "images/Material/分光棱镜.png", quantity: 1 },
    { name: "回射棱镜", location: "光学耗材", imageUrl: "images/Material/回射棱镜.png", quantity: 1 },
    { name: "波片", location: "光学耗材", imageUrl: "images/Material/波片.png", quantity: 1 },
    { name: "滤光片", location: "光学耗材", imageUrl: "images/Material/滤光片.png", quantity: 1 },
    { name: "物镜", location: "光学耗材", imageUrl: "images/Material/物镜.png", quantity: 1 },
    { name: "离轴抛面镜", location: "光学耗材", imageUrl: "images/Material/离轴抛面镜.png", quantity: 1 },
    { name: "银膜反射镜", location: "光学耗材", imageUrl: "images/Material/银膜反射镜.png", quantity: 1 },
    { name: "偏振分光棱镜", location: "光学耗材", imageUrl: "images/Material/偏振分光棱镜.png", quantity: 1 },
    { name: "BNC", location: "电学耗材", imageUrl: "images/Material/BNC.png", quantity: 1 },
    { name: "SMA", location: "电学耗材", imageUrl: "images/Material/sma.png", quantity: 1 },
    { name: "光电二极管", location: "电学耗材", imageUrl: "images/Material/光电二极管.png", quantity: 1 },
    { name: "扩束镜", location: "光学基本仪器", imageUrl: "images/Material/扩束镜.png", quantity: 1 },
    { name: "Thorlabs CCD光谱仪", location: "光谱学仪器", imageUrl: "images/Material/thorlabs CCD光谱仪.png", quantity: 1 },
    { name: "复享光谱仪", location: "光谱学仪器", imageUrl: "images/Material/复享光谱仪.png", quantity: 1 },
    { name: "超快反射镜", location: "超快光学仪器", imageUrl: "images/Material/超快反射镜.png", quantity: 1 },
    { name: "凹面谐振腔", location: "超快光学仪器", imageUrl: "images/Material/凹面谐振腔.png", quantity: 1 },
    { name: "Acqiris采集卡", location: "采集卡和电脑", imageUrl: "images/Material/acqiris采集卡.png", quantity: 1 },
    { name: "BH采集卡", location: "采集卡和电脑", imageUrl: "images/Material/bh采集卡.png", quantity: 1 },
    { name: "vDAQ", location: "采集卡和电脑", imageUrl: "images/Material/vdaq.png", quantity: 1 },
    { name: "台式电脑", location: "采集卡和电脑", imageUrl: "images/Material/台式电脑.png", quantity: 1 },
    { name: "keysight示波器", location: "电学仪器", imageUrl: "images/Material/Keysight示波器.png", quantity: 1 },
    { name: "光学平台", location: "机械设备", imageUrl: "images/Material/光学平台.png", quantity: 1 },
    { name: "激光器", location: "激光器", imageUrl: "images/Material/激光器.png", quantity: 1 },
    { name: "郎研激光器", location: "激光器", imageUrl: "images/Material/郎研激光.png", quantity: 1 },
    { name: "安扬连续光", location: "激光器", imageUrl: "images/Material/安扬连续光.jpg", quantity: 1 },
    { name: "NKT连续光", location: "激光器", imageUrl: "images/Material/NKT连续光.jpg", quantity: 1 },
    { name: "50.8透镜", location: "其他设备", imageUrl: "images/Material/50.8透镜.png", quantity: 1 },
    { name: "25.4透镜", category: "其他", location: "大光学实验室", imageUrl: "images/Material/25.4透镜.png", quantity: 1 },
];

/**
 * 如果数据库为空，则使用默认数据进行填充
 */
export async function seedDatabaseIfEmpty() {
    const itemsCollection = collection(db, ITEMS_COLLECTION);
    const snapshot = await getDocs(itemsCollection);

    if (snapshot.empty) {
        console.log("Database is empty. Seeding with default data...");
        try {
            const batch = writeBatch(db);

            // 1. 添加所有物品
            const itemsWithCategory = defaultItems.map(item => {
                // 这个转换是为了兼容旧的 defaultItems 结构，以防万一
                if (!item.category) {
                    return {
                        ...item,
                        category: item.location,
                        location: '大光学实验室'
                    };
                }
                return item;
            });

            itemsWithCategory.forEach(item => {
                const docRef = doc(collection(db, ITEMS_COLLECTION));
                batch.set(docRef, { ...item, createdAt: serverTimestamp() });
            });

            // 2. 设置目录结构
            const directoriesDocRef = doc(db, "materials", "data");
            batch.set(directoriesDocRef, { directories: directoryStructure });

            await batch.commit();
            console.log("Database successfully seeded!");
            return true; // 表示执行了填充
        } catch (error) {
            console.error("Error seeding database: ", error);
        }
    } else {
        console.log("Database already contains data. Skipping seed.");
    }
    return false; // 表示未执行填充
}

/**
 * 从 Firestore 获取所有物品
 * @returns {Promise<Array>} 包含所有物品对象的数组
 */
export async function fetchItems() {
    try {
        const querySnapshot = await getDocs(collection(db, ITEMS_COLLECTION));
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        console.log("Fetched items: ", items);
        return items;
    } catch (error) {
        console.error("Error fetching items: ", error);
        return [];
    }
}

/**
 * 上传图片到 Firebase Storage
 * @param {File} imageFile 要上传的图片文件
 * @returns {Promise<string|null>} 图片的下载链接，如果无图片则为 null
 */
async function uploadImage(imageFile) {
    if (!imageFile) return null;
    const storageRef = ref(storage, `item-images/${Date.now()}_${imageFile.name}`);
    try {
        const snapshot = await uploadBytes(storageRef, imageFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image: ", error);
        return null;
    }
}

/**
 * 添加一个新物品到 Firestore
 * @param {object} itemData 物品数据, 包含 name, quantity, location, category
 * @returns {Promise<object|null>} 成功时返回添加的物品对象，失败则为 null
 */
export async function addItem(itemData) {
    try {
        const imageUrl = await uploadImage(itemData.imageFile);

        const itemPayload = {
            name: itemData.name,
            quantity: itemData.quantity,
            location: itemData.location, // 物理位置
            category: itemData.category, // 物品分类
            createdAt: serverTimestamp()
        };

        if (imageUrl) {
            itemPayload.imageUrl = imageUrl;
        }

        const docRef = await addDoc(collection(db, ITEMS_COLLECTION), itemPayload);
        console.log("Document written with ID: ", docRef.id);

        return {
            id: docRef.id,
            ...itemPayload,
            createdAt: new Date()
        };
    } catch (e) {
        console.error("Error adding document: ", e);
        alert('添加物品失败，请查看控制台获取更多信息。');
        return null;
    }
}

/**
 * 从 Firestore 获取导航目录结构
 * @returns {Promise<Array>} 包含目录结构的对象数组
 */
export async function fetchDirectoryStructure() {
    const docRef = doc(db, DIRECTORIES_DOC_PATH);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().directories) {
            console.log("Fetched directory structure:", docSnap.data().directories);
            return docSnap.data().directories;
        } else {
            console.log("No directory structure found in Firestore. Using empty array.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching directory structure: ", error);
        return [];
    }
}

/**
 * 将新的目录结构完整保存到 Firestore
 * @param {Array} directories - 新的完整目录结构数组
 * @returns {Promise<boolean>} 是否保存成功
 */
export async function saveDirectoryStructure(directories) {
    try {
        const docRef = doc(db, DIRECTORIES_DOC_PATH);
        await setDoc(docRef, { directories });
        console.log("Directory structure successfully saved.");
        return true;
    } catch (error) {
        console.error("Error saving directory structure: ", error);
        alert('保存目录结构失败，请查看控制台获取更多信息。');
        return false;
    }
}

/**
 * 更新一个物品的信息
 * @param {string} itemId - 要更新的物品ID
 * @param {object} updatedData - 包含更新后信息的对象 (e.g., { name, quantity, location })
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateItem(itemId, updatedData) {
    try {
        const itemRef = doc(db, ITEMS_COLLECTION, itemId);
        await updateDoc(itemRef, updatedData);
        console.log(`Item with ID: ${itemId} successfully updated.`);
        return true;
    } catch (error) {
        console.error("Error updating item: ", error);
        alert('更新物品失败，请查看控制台获取更多信息。');
        return false;
    }
}

/**
 * 从 Firestore 删除一个物品
 * @param {string} itemId 要删除的物品的ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteItem(itemId) {
    try {
        const itemRef = doc(db, ITEMS_COLLECTION, itemId);
        await deleteDoc(itemRef);
        console.log(`Item with ID: ${itemId} successfully deleted.`);
        return true;
    } catch (error) {
        console.error("Error deleting item: ", error);
        alert('删除物品失败，请查看控制台获取更多信息。');
        return false;
    }
} 