import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const USERS_COLLECTION = 'users';

// Tạo profile user mới (role mặc định = 'user')
export const createUserProfile = async (uid, email) => {
  const ref = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email,
      role: 'user',
    });
  }
};

// Lấy role của user
export const getUserRole = async (uid) => {
  try {
    const ref = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().role || 'user';
    }
    return 'user';
  } catch {
    return 'user';
  }
};
