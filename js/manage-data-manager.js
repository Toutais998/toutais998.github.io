/* 
=====================================================================
* 文件名: manage-data-manager.js
* 版本: V3.0
* 创建日期: 2025-07-05
* 最后修改: 2025-07-10
* 
* 功能简介:
* - Yang Lab 设备管理页面的专用数据处理模块 (V3 - 修正版)。
* - 严格遵循项目中已有的 Firestore 数据结构。
* - 负责与 'lab-items' 和 'materials' 集合的数据交互。
* - 提供获取目录、获取所有物品、添加/更新/删除物品以及保存目录的函数。
=====================================================================
*/

import { db, doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from './firebase-config.js';

// --- 全局常量 ---
const LAB_ITEMS_COLLECTION = 'lab-items';
const DIRECTORIES_DOC_PATH = 'materials/data';

/**
 * @description 从 Firestore 的 'materials/data' 文档中获取目录结构。
 * @returns {Promise<Array<object>>} 返回目录结构数组，例如 [{ id: 'optics', name: '光学元件' }, ...]。
 */
export async function getDirectoryStructure() {
    try {
        const docRef = doc(db, DIRECTORIES_DOC_PATH);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().directories) {
            console.log("成功获取目录结构:", docSnap.data().directories);
            return docSnap.data().directories;
        } else {
            console.warn(`目录结构文档 '${DIRECTORIES_DOC_PATH}' 不存在或其中没有 'directories' 字段。`);
            return [];
        }
    } catch (error) {
        console.error("获取目录结构失败:", error);
        throw error;
    }
}

/**
 * @description 将新的目录结构保存到 'materials/data' 文档。
 * @param {Array<object>} newDirectories - 最新的目录结构数组。
 * @returns {Promise<void>}
 */
export async function saveDirectoryStructure(newDirectories) {
    const docRef = doc(db, DIRECTORIES_DOC_PATH);
    await setDoc(docRef, { directories: newDirectories });
}


/**
 * @description 从 'lab-items' 集合获取所有设备物品。
 * @returns {Promise<Array<object>>} 返回包含所有物品对象的数组，每个对象包含其Firestore文档ID。
 */
export async function getAllItems() {
    try {
        const querySnapshot = await getDocs(collection(db, LAB_ITEMS_COLLECTION));
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        console.log(`成功获取 ${items.length} 个物品。`);
        return items;
    } catch (error) {
        console.error("获取所有物品失败:", error);
        throw error;
    }
}

/**
 * @description 向 'lab-items' 集合中添加一个新物品。
 * @param {object} itemData - 要添加的物品数据，不包含ID。
 * @returns {Promise<string>} 返回新创建物品的文档ID。
 */
export async function addItem(itemData) {
    const docRef = await addDoc(collection(db, LAB_ITEMS_COLLECTION), {
        ...itemData,
        createdAt: serverTimestamp() // 可选：自动添加创建时间
    });
    return docRef.id;
}

/**
 * @description 更新 'lab-items' 集合中一个现有物品的数据。
 * @param {string} itemId - 要更新的物品的文档ID。
 * @param {object} itemData - 包含更新字段的对象。
 * @returns {Promise<void>}
 */
export async function updateItem(itemId, itemData) {
    const docRef = doc(db, LAB_ITEMS_COLLECTION, itemId);
    await updateDoc(docRef, itemData);
}

/**
 * @description 从 'lab-items' 集合中删除一个物品。
 * @param {string} itemId - 要删除的物品的文档ID。
 * @returns {Promise<void>}
 */
export async function deleteItem(itemId) {
    const docRef = doc(db, LAB_ITEMS_COLLECTION, itemId);
    await deleteDoc(docRef);
} 