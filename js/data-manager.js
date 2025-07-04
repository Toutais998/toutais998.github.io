// 数据管理文件
// 用于集中管理实验室物料数据结构和数据操作功能

import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { db, storage } from './firebase-config.js';

const ITEMS_COLLECTION = 'lab-items';

// 默认数据结构 (V2.1 - 固定数据)
export const defaultDirectories = [
    {
        id: 'consumables', name: '耗材', type: 'category', children: [
            {
                id: 'optical-consumables', name: '光学耗材', type: 'section', items: [
                    { id: 'item-scan-lens', name: 'scan lens', imageSrc: 'images/Material/scan lens.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-prism', name: '三棱镜', imageSrc: 'images/Material/三棱镜.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-dichroic-mirror', name: '二向色镜', imageSrc: 'images/Material/二向色镜.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-aperture', name: '光阑', imageSrc: 'images/Material/光阑.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-beam-splitter-plate', name: '分光平片', imageSrc: 'images/Material/分光平片.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-beam-splitter-cube', name: '分光棱镜', imageSrc: 'images/Material/分光棱镜.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-retroreflector', name: '回射棱镜', imageSrc: 'images/Material/回射棱镜.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-waveplate', name: '波片', imageSrc: 'images/Material/波片.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-filter', name: '滤光片', imageSrc: 'images/Material/滤光片.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-objective', name: '物镜', imageSrc: 'images/Material/物镜.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-off-axis-parabolic-mirror', name: '离轴抛面镜', imageSrc: 'images/Material/离轴抛面镜.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-silver-mirror', name: '银膜反射镜', imageSrc: 'images/Material/银膜反射镜.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-polarizing-beamsplitter', name: '偏振分光棱镜', imageSrc: 'images/Material/偏振分光棱镜.png', quantity: 4, location: '大光学实验室' },
                ]
            },
            {
                id: 'electrical-consumables', name: '电学耗材', type: 'section', items: [
                    { id: 'item-bnc', name: 'bnc', imageSrc: 'images/Material/BNC.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-sma', name: 'sma', imageSrc: 'images/Material/sma.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-photodiode', name: '光电二极管', imageSrc: 'images/Material/光电二极管.png', quantity: 4, location: '大光学实验室' },
                ]
            },
            { id: 'other-consumables', name: '其他耗材', type: 'section', items: [] }
        ]
    },
    {
        id: 'equipment', name: '仪器设备', type: 'category', children: [
            {
                id: 'basic-optical-instruments', name: '光学基本仪器', type: 'section', items: [
                    { id: 'item-beam-expander', name: '扩束镜', imageSrc: 'images/Material/扩束镜.png', quantity: 4, location: '大光学实验室' },
                ]
            },
            {
                id: 'spectroscopy-instruments', name: '光谱学仪器', type: 'section', items: [
                    { id: 'item-thorlabs-ccd', name: 'thorlabs CCD光谱仪', imageSrc: 'images/Material/thorlabs CCD光谱仪.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-fuxiang-spectrometer', name: '复享光谱仪', imageSrc: 'images/Material/复享光谱仪.png', quantity: 4, location: '大光学实验室' },
                ]
            },
            {
                id: 'ultrafast-optics-instruments', name: '超快光学仪器', type: 'section', items: [
                    { id: 'item-ultrafast-mirror', name: '超快反射镜', imageSrc: 'images/Material/超快反射镜.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-cavity-mirror', name: '凹面谐振腔', imageSrc: 'images/Material/凹面谐振腔.png', quantity: 4, location: '大光学实验室' },
                ]
            },
            {
                id: 'daq-and-computers', name: '采集卡和电脑', type: 'section', items: [
                    { id: 'item-acqiris', name: 'acqiris采集卡', imageSrc: 'images/Material/acqiris采集卡.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-bh-card', name: 'bh采集卡', imageSrc: 'images/Material/bh采集卡.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-vdaq', name: 'vdaq', imageSrc: 'images/Material/vdaq.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-desktop', name: '台式电脑', imageSrc: 'images/Material/台式电脑.png', quantity: 4, location: '大光学实验室' },
                ]
            },
            {
                id: 'electrical-instruments', name: '电学仪器', type: 'section', items: [
                    { id: 'item-keysight-scope', name: 'keysight示波器', imageSrc: 'images/Material/Keysight示波器.png', quantity: 4, location: '大光学实验室' },
                ]
            },
            {
                id: 'mechanical-equipment', name: '机械设备', type: 'section', items: [
                    { id: 'item-optical-table', name: '光学平台', imageSrc: 'images/Material/光学平台.png', quantity: 4, location: '大光学实验室' },
                ]
            },
            {
                id: 'laser-equipment', name: '激光器', type: 'section', items: [
                    { id: 'item-laser', name: '激光器', imageSrc: 'images/Material/激光器.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-langyan-laser', name: '郎研激光器', imageSrc: 'images/Basic/paris.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-anyang-cw', name: '安扬连续光', imageSrc: 'images/Basic/paris.png', quantity: 4, location: '大光学实验室' },
                    { id: 'item-nkt-cw', name: 'NKT连续光', imageSrc: 'images/Basic/paris.png', quantity: 4, location: '大光学实验室' },
                ]
            },
            {
                id: 'other-equipment', name: '其他设备', type: 'section', items: [
                    { id: 'item-lens-50', name: '50.8透镜', imageSrc: 'images/Material/50.8透镜.png', quantity: 4, location: '大光学实验室' },
                ]
            }
        ]
    },
    {
        id: 'others', name: '其他', type: 'category', children: [
            {
                id: 'other-materials', name: '其他物料', type: 'section', items: [
                    { id: 'item-lens-25', name: '25.4透镜', imageSrc: 'images/Material/25.4透镜.png', quantity: 4, location: '大光学实验室' },
                ]
            }
        ]
    }
];

// 生成唯一ID
export function generateUniqueId(prefix) {
    return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

// 查找物品所在的类别和子类别
export function findItemLocation(directories, itemId) {
    for (const category of directories) {
        for (const subcategory of category.children || []) {
            if (subcategory.items) {
                const itemIndex = subcategory.items.findIndex(item => item.id === itemId);
                if (itemIndex !== -1) {
                    return {
                        category,
                        subcategory,
                        itemIndex
                    };
                }
            }
        }
    }
    return null;
}

// 添加新物品
export function addNewItem(directories, categoryId, newItem) {
    const directoriesCopy = JSON.parse(JSON.stringify(directories)); // 深拷贝，避免直接修改原始数据

    let found = false;

    // 遍历目录结构查找目标类别
    for (const category of directoriesCopy) {
        for (const subcategory of category.children || []) {
            if (subcategory.id === categoryId) {
                // 找到目标类别，添加新物品
                if (!subcategory.items) {
                    subcategory.items = [];
                }
                subcategory.items.push(newItem);
                found = true;
                break;
            }
        }
        if (found) break;
    }

    return {
        success: found,
        directories: directoriesCopy
    };
}

// 删除物品
export function deleteItem(directories, itemId) {
    const directoriesCopy = JSON.parse(JSON.stringify(directories)); // 深拷贝
    const location = findItemLocation(directoriesCopy, itemId);

    if (location) {
        location.subcategory.items.splice(location.itemIndex, 1);
        return {
            success: true,
            directories: directoriesCopy
        };
    }

    return {
        success: false,
        directories: directoriesCopy
    };
}

// 修复图片路径
export function fixImagePaths(directories) {
    // 这里可以添加图片路径修复逻辑
    // 例如检查图片是否存在，不存在则使用默认图片
    return directories;
}

// 获取父类别ID
export function getParentId(contentId) {
    if (contentId.includes('consumables')) {
        return 'consumables';
    } else if (contentId.includes('equipment')) {
        return 'equipment';
    } else if (contentId.includes('materials')) {
        return 'others';
    }
    return null;
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
 * @param {object} itemData 物品数据，包含 name, quantity, location, imageFile
 * @returns {Promise<object|null>} 成功时返回添加的物品对象，失败则为 null
 */
export async function addItem(itemData) {
    try {
        const imageUrl = await uploadImage(itemData.imageFile);

        const itemPayload = {
            name: itemData.name,
            quantity: itemData.quantity,
            location: itemData.location,
            createdAt: serverTimestamp()
        };

        if (imageUrl) {
            itemPayload.imageUrl = imageUrl;
        }

        const docRef = await addDoc(collection(db, ITEMS_COLLECTION), itemPayload);
        console.log("Document written with ID: ", docRef.id);

        // 返回包含新生成ID和时间戳的完整对象
        return {
            id: docRef.id,
            ...itemData,
            imageUrl: imageUrl || null,
            createdAt: new Date()
        };
    } catch (e) {
        console.error("Error adding document: ", e);
        alert('添加物品失败，请查看控制台获取更多信息。');
        return null;
    }
} 