import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "...-OvPDz1G0",
  authDomain: ".....m",
  projectId: "......",
  storageBucket: ".....",
  messagingSenderId: ".....",
  appId: "....",
  measurementId: "...."
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
export const CLOUDINARY_CLOUD_NAME = 'example';
export const CLOUDINARY_UPLOAD_PRESET = 'example';

// 🤖 Google Gemini API Key (miễn phí tại https://aistudio.google.com/apikey)
export const GEMINI_API_KEY = '...........';

