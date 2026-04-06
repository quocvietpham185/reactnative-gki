import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBF8YLMbaDoXRH81Z8SnJHIo7-OvPDz1G0",
  authDomain: "ktragiuakidanentang.firebaseapp.com",
  projectId: "ktragiuakidanentang",
  storageBucket: "ktragiuakidanentang.firebasestorage.app",
  messagingSenderId: "530290254899",
  appId: "1:530290254899:web:e819a7db4d3e7102a96f46",
  measurementId: "G-QNFKD5F8MM"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ⚙️ Cloudinary config (free 25GB/tháng)
// Bước 1: Tạo tài khoản tại cloudinary.com (miễn phí)
// Bước 2: Vào Settings > Upload > Add upload preset > chọn "Unsigned" > Save
// Bước 3: Điền Cloud name và Upload preset name vào đây
export const CLOUDINARY_CLOUD_NAME = 'dkhivu5h0';
export const CLOUDINARY_UPLOAD_PRESET = 'ktragiuakidanentang';

// 🤖 Google Gemini API Key (miễn phí tại https://aistudio.google.com/apikey)
export const GEMINI_API_KEY = 'AIzaSyCgvMml5pRUG9TkXr7mQfukHjASO2K6e_k';

