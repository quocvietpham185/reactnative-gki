import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { addProduct } from '../services/productService';
import { GEMINI_API_KEY } from '../config/firebase';

// Gọi Gemini API để sinh thông tin sản phẩm
const generateProductWithAI = async (description) => {
  const prompt = `Tạo thông tin sản phẩm dựa trên mô tả: "${description}"

Trả về JSON với đúng 4 trường sau:
- tensp: tên sản phẩm đầy đủ (string)
- loaisp: loại/danh mục sản phẩm (string)
- gia: giá bằng số nguyên VND (number)
- moTa: mô tả ngắn 1-2 câu (string)`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'Lỗi kết nối Gemini API');
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Strip markdown code fences nếu có
  let cleanText = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Thử parse thẳng trước
  try {
    return JSON.parse(cleanText);
  } catch (_) {
    // Fallback: tìm khối { } đầu tiên
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI không trả về JSON hợp lệ');
    return JSON.parse(jsonMatch[0]);
  }
};



export default function AIGenerateScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);  // kết quả AI trả về
  const [saving, setSaving] = useState(false);

  // Cho phép chỉnh sửa các field AI sinh ra
  const [tensp, setTensp] = useState('');
  const [loaisp, setLoaisp] = useState('');
  const [gia, setGia] = useState('');
  const [moTa, setMoTa] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả sản phẩm');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const product = await generateProductWithAI(description.trim());
      setResult(product);
      setTensp(product.tensp || '');
      setLoaisp(product.loaisp || '');
      setGia(product.gia?.toString() || '');
      setMoTa(product.moTa || '');
    } catch (e) {
      Alert.alert('Lỗi AI', e.message || 'Không thể tạo sản phẩm với AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tensp.trim() || !loaisp.trim() || !gia.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ tên, loại và giá sản phẩm');
      return;
    }
    if (isNaN(Number(gia)) || Number(gia) < 0) {
      Alert.alert('Lỗi', 'Giá không hợp lệ');
      return;
    }
    setSaving(true);
    try {
      await addProduct({
        tensp: tensp.trim(),
        loaisp: loaisp.trim(),
        gia: Number(gia),
        hinhanh: '',
      });
      Alert.alert('✅ Thành công', 'Sản phẩm đã được thêm vào danh sách!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu sản phẩm: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroIcon}>✨</Text>
          <Text style={styles.heroTitle}>AI Tạo Sản Phẩm</Text>
          <Text style={styles.heroSubtitle}>
            Mô tả sản phẩm bằng ngôn ngữ tự nhiên, AI sẽ tự điền thông tin
          </Text>
        </View>

        {/* Input mô tả */}
        <View style={styles.card}>
          <Text style={styles.label}>📝 Mô tả sản phẩm</Text>
          <TextInput
            style={styles.textArea}
            placeholder={'VD: tai nghe bluetooth Sony chống ồn\nhoặc: áo thun nam cotton màu trắng size L giá tầm 200k'}
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.generateBtn, loading && styles.btnDisabled]}
            onPress={handleGenerate}
            disabled={loading || saving}
          >
            {loading ? (
              <View style={styles.rowCenter}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateBtnText}>  Đang tạo...</Text>
              </View>
            ) : (
              <Text style={styles.generateBtnText}>🤖  Tạo với AI</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Kết quả AI - chỉ hiện sau khi có kết quả */}
        {result && (
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>✅ Kết quả AI</Text>
              <Text style={styles.resultHint}>Bạn có thể chỉnh sửa trước khi lưu</Text>
            </View>

            {/* Mô tả AI */}
            {moTa ? (
              <View style={styles.aiDescBox}>
                <Text style={styles.aiDescText}>💡 {moTa}</Text>
              </View>
            ) : null}

            {/* Tên sản phẩm */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Tên sản phẩm *</Text>
              <TextInput
                style={styles.input}
                value={tensp}
                onChangeText={setTensp}
                placeholder="Tên sản phẩm"
                placeholderTextColor="#aaa"
              />
            </View>

            {/* Loại sản phẩm */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Loại sản phẩm *</Text>
              <TextInput
                style={styles.input}
                value={loaisp}
                onChangeText={setLoaisp}
                placeholder="Loại sản phẩm"
                placeholderTextColor="#aaa"
              />
            </View>

            {/* Giá */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Giá (VNĐ) *</Text>
              <TextInput
                style={styles.input}
                value={gia}
                onChangeText={setGia}
                placeholder="Giá"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
              />
            </View>

            {/* Nút lưu */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving || loading}
            >
              {saving ? (
                <View style={styles.rowCenter}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.saveBtnText}>  Đang lưu...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>💾  Lưu sản phẩm</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Gợi ý */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Gợi ý mô tả hay</Text>
          {[
            'iPhone 15 Pro Max 256GB màu titan tự nhiên',
            'Laptop Dell Inspiron 15 Core i5 RAM 16GB',
            'Giày Nike Air Max 270 size 42 màu đen trắng',
            'Nồi cơm điện Panasonic 1.8L giá rẻ',
          ].map((tip, i) => (
            <TouchableOpacity
              key={i}
              style={styles.tipChip}
              onPress={() => setDescription(tip)}
            >
              <Text style={styles.tipText}>→ {tip}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f8' },
  content: { padding: 16, paddingBottom: 40 },

  heroBanner: {
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  heroIcon: { fontSize: 48, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', lineHeight: 19 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  textArea: {
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    padding: 13,
    fontSize: 14,
    color: '#222',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    minHeight: 100,
    marginBottom: 14,
  },
  generateBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },

  resultHeader: { marginBottom: 12 },
  resultTitle: { fontSize: 15, fontWeight: '800', color: '#1a1f36' },
  resultHint: { fontSize: 12, color: '#888', marginTop: 2 },
  aiDescBox: {
    backgroundColor: '#f0ebff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed',
  },
  aiDescText: { fontSize: 13, color: '#5b21b6', lineHeight: 19 },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: '#222',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  saveBtn: {
    backgroundColor: '#4f6ef7',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 10 },
  tipChip: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8',
  },
  tipText: { fontSize: 13, color: '#4f6ef7' },
});
