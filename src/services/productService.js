import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';


const COLLECTION = 'sanpham';

// Lắng nghe real-time danh sách sản phẩm
export const subscribeProducts = (callback) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map((doc) => ({
      idsanpham: doc.id,
      ...doc.data(),
    }));
    callback(products);
  });
};

// Thêm sản phẩm mới
export const addProduct = async (data) => {
  return await addDoc(collection(db, COLLECTION), {
    tensp: data.tensp,
    loaisp: data.loaisp,
    gia: Number(data.gia),
    hinhanh: data.hinhanh || '',
    createdAt: serverTimestamp(),
  });
};

// Cập nhật sản phẩm
export const updateProduct = async (id, data) => {
  const ref = doc(db, COLLECTION, id);
  return await updateDoc(ref, {
    tensp: data.tensp,
    loaisp: data.loaisp,
    gia: Number(data.gia),
    hinhanh: data.hinhanh || '',
    updatedAt: serverTimestamp(),
  });
};

// Xóa sản phẩm
export const deleteProduct = async (id) => {
  const ref = doc(db, COLLECTION, id);
  return await deleteDoc(ref);
};
