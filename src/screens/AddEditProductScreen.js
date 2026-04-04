import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/firebase';
import { addProduct, updateProduct } from '../services/productService';

// Upload ảnh lên Cloudinary (free 25GB/tháng)
const uploadToCloudinary = async (uri) => {
  const fileName = uri.split('/').pop();
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri, name: fileName, type: mimeType });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'sanpham');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) throw new Error('Upload Cloudinary thất bại');
  const data = await res.json();
  return data.secure_url;
};

export default function AddEditProductScreen({ route, navigation }) {
  const editProduct = route.params?.product || null;
  const isEdit = !!editProduct;

  const [tensp, setTensp] = useState(editProduct?.tensp || '');
  const [loaisp, setLoaisp] = useState(editProduct?.loaisp || '');
  const [gia, setGia] = useState(editProduct?.gia?.toString() || '');
  const [imageUri, setImageUri] = useState(editProduct?.hinhanh || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm',
    });
  }, []);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { Alert.alert('Lỗi', 'Cần quyền truy cập camera'); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Chọn hình ảnh', 'Lấy ảnh từ đâu?', [
      { text: '📷 Camera', onPress: takePhoto },
      { text: '🖼️ Thư viện', onPress: pickImage },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const validate = () => {
    if (!tensp.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên sản phẩm'); return false; }
    if (!loaisp.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập loại sản phẩm'); return false; }
    if (!gia.trim() || isNaN(Number(gia)) || Number(gia) < 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ'); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let hinhanhUrl = editProduct?.hinhanh || '';

      // Nếu user chọn ảnh mới (uri local, không phải http)
      if (imageUri && !imageUri.startsWith('http')) {
        setUploading(true);
        hinhanhUrl = await uploadToCloudinary(imageUri);
        setUploading(false);
      }

      const data = {
        tensp: tensp.trim(),
        loaisp: loaisp.trim(),
        gia: Number(gia),
        hinhanh: hinhanhUrl,
      };

      if (isEdit) {
        await updateProduct(editProduct.idsanpham, data);
        Alert.alert('✅ Thành công', 'Cập nhật sản phẩm thành công', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addProduct(data);
        Alert.alert('✅ Thành công', 'Thêm sản phẩm thành công', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      setUploading(false);
      Alert.alert('Lỗi', e.message || 'Không thể lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const isLocalImage = imageUri && !imageUri.startsWith('http');
  const isProcessing = uploading || saving;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={showImageOptions}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.changeImageOverlay}>
                <Text style={styles.changeImageText}>📷 Đổi ảnh</Text>
              </View>
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>Nhấn để thêm hình ảnh</Text>
              <Text style={styles.imagePlaceholderSub}>Camera hoặc Thư viện</Text>
            </View>
          )}
          {isLocalImage && (
            <View style={styles.uploadBadge}>
              <Text style={styles.uploadBadgeText}>⬆️ Sẽ upload khi lưu</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Tên sản phẩm *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên sản phẩm"
              placeholderTextColor="#aaa"
              value={tensp}
              onChangeText={setTensp}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Loại sản phẩm *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Điện thoại, Laptop, Quần áo..."
              placeholderTextColor="#aaa"
              value={loaisp}
              onChangeText={setLoaisp}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Giá (VNĐ) *</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 150000"
              placeholderTextColor="#aaa"
              value={gia}
              onChangeText={setGia}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, isProcessing && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.saveBtnText}>
                {uploading ? '  Đang upload ảnh...' : '  Đang lưu...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>
              {isEdit ? '💾  Cập nhật sản phẩm' : '➕  Thêm sản phẩm'}
            </Text>
          )}
        </TouchableOpacity>

        {isEdit && (
          <View style={styles.idBox}>
            <Text style={styles.idLabel}>ID Sản phẩm:</Text>
            <Text style={styles.idValue}>{editProduct.idsanpham}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f8' },
  content: { padding: 16, paddingBottom: 40 },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  imagePlaceholderIcon: { fontSize: 48, marginBottom: 8 },
  imagePlaceholderText: { fontSize: 15, fontWeight: '600', color: '#555' },
  imagePlaceholderSub: { fontSize: 12, color: '#aaa', marginTop: 4 },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    alignItems: 'center',
  },
  changeImageText: { color: '#fff', fontWeight: '600' },
  uploadBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4f6ef7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  uploadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 6 },
  input: {
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  saveBtn: {
    backgroundColor: '#4f6ef7',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveBtnDisabled: { backgroundColor: '#9aabf7' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  idBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e4f0',
  },
  idLabel: { fontSize: 11, color: '#aaa', marginBottom: 2 },
  idValue: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
