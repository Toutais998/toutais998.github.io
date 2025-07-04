/**
 * Firebase Import Map
 * 
 * This file provides import mappings for Firebase modules when deploying to GitHub Pages
 * or other environments where bare module specifiers are not supported.
 */

// Define base Firebase SDK version to use
const FIREBASE_VERSION = '9.22.1';
const FIREBASE_BASE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;

// Map of module names to their CDN URLs
const firebaseModules = {
    'firebase/app': `${FIREBASE_BASE_URL}/firebase-app.js`,
    'firebase/auth': `${FIREBASE_BASE_URL}/firebase-auth.js`,
    'firebase/firestore': `${FIREBASE_BASE_URL}/firebase-firestore.js`,
    'firebase/storage': `${FIREBASE_BASE_URL}/firebase-storage.js`,
    'firebase/analytics': `${FIREBASE_BASE_URL}/firebase-analytics.js`,
    'firebase/functions': `${FIREBASE_BASE_URL}/firebase-functions.js`,
    'firebase/database': `${FIREBASE_BASE_URL}/firebase-database.js`
};

// For browsers that support import maps
const importMap = {
    imports: firebaseModules
};

// Create import map if the browser supports it
if (document.createElement('script').type === 'importmap') {
    const script = document.createElement('script');
    script.type = 'importmap';
    script.textContent = JSON.stringify(importMap);
    document.currentScript.after(script);
    console.log('Firebase import map added to document');
} else {
    console.warn('This browser does not support import maps. Firebase imports may fail.');
}

export { FIREBASE_BASE_URL }; 