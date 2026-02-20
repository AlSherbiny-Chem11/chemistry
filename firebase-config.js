// إعدادات اتصال Firebase الخاصة بأكاديمية الشربيني
const config = { 
    apiKey: "AIzaSyAyIsaApHUjEQWJgGhCom25pUj8Bm9LYyQ", 
    authDomain: "sherbiny-academy.firebaseapp.com", 
    projectId: "sherbiny-academy", 
    storageBucket: "sherbiny-academy.firebasestorage.app", 
    messagingSenderId: "349228281326", 
    appId: "1:349228281326:web:ffbbf1eb5927b50d13f2ff" 
};

// بدء تشغيل Firebase
firebase.initializeApp(config);

// تعريف المتغيرات الأساسية لاستخدامها في ملف app.js
const auth = firebase.auth();
const db = firebase.firestore();