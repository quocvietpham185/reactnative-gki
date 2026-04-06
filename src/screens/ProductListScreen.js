import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { subscribeProducts, deleteProduct } from '../services/productService';
import { useAuth } from '../context/AuthContext';

const SORT_OPTIONS = [
  { key: 'newest', label: 'Mới nhất' },
  { key: 'price_asc', label: 'Giá ↑' },
  { key: 'price_desc', label: 'Giá ↓' },
];

export default function ProductListScreen({ navigation }) {
  const { isAdmin, role } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortKey, setSortKey] = useState('newest');

  useEffect(() => {
    const unsubscribe = subscribeProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Danh sách loại SP duy nhất từ data
  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.loaisp).filter(Boolean))];
    return cats;
  }, [products]);

  // Lọc + tìm kiếm + sắp xếp
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchText.trim()) {
      result = result.filter((p) =>
        p.tensp?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedCategory) {
      result = result.filter((p) => p.loaisp === selectedCategory);
    }

    if (sortKey === 'price_asc') {
      result.sort((a, b) => (a.gia || 0) - (b.gia || 0));
    } else if (sortKey === 'price_desc') {
      result.sort((a, b) => (b.gia || 0) - (a.gia || 0));
    }

    return result;
  }, [products, searchText, selectedCategory, sortKey]);

  const handleDelete = (item) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa "${item.tensp}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(item.idsanpham);
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.hinhanh ? (
        <Image source={{ uri: item.hinhanh }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>📷</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.productName} numberOfLines={1}>{item.tensp}</Text>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.loaisp}</Text>
          </View>
        </View>
        <Text style={styles.price}>{formatPrice(item.gia)}</Text>
      </View>
      {/* Nút sửa/xóa chỉ hiện với Admin */}
      {isAdmin && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AddEditProduct', { product: item })}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sản Phẩm</Text>
          <Text style={styles.headerSub}>
            {filteredProducts.length}/{products.length} sản phẩm
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* Badge role */}
          <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
            <Text style={styles.roleBadgeText}>{isAdmin ? '👑 Admin' : '👤 User'}</Text>
          </View>
          {/* Nút AI - chỉ Admin */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={() => navigation.navigate('AIGenerate')}
            >
              <Text style={styles.aiBtnText}>✨ AI</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Bar */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortBtn, sortKey === opt.key && styles.sortBtnActive]}
            onPress={() => setSortKey(opt.key)}
          >
            <Text style={[styles.sortBtnText, sortKey === opt.key && styles.sortBtnTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[styles.catChip, selectedCategory === '' && styles.catChipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.catChipText, selectedCategory === '' && styles.catChipTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
            >
              <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4f6ef7" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>{searchText || selectedCategory ? '🔍' : '📦'}</Text>
          <Text style={styles.emptyText}>
            {searchText || selectedCategory ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
          </Text>
          {(searchText || selectedCategory) && (
            <TouchableOpacity
              onPress={() => { setSearchText(''); setSelectedCategory(''); }}
              style={styles.clearFilterBtn}
            >
              <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.idsanpham}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - chỉ Admin mới thấy */}
      {isAdmin && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddEditProduct', { product: null })}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f8' },
  header: {
    backgroundColor: '#1a1f36',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerSub: { color: '#8fa0ca', fontSize: 12, marginTop: 2 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  roleBadgeAdmin: {
    backgroundColor: '#f0b429',
  },
  roleBadgeUser: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  aiBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  aiBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  logoutText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#222', paddingVertical: 10 },
  clearBtn: { fontSize: 16, color: '#aaa', paddingHorizontal: 4 },

  // Sort
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  sortBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e4f0',
  },
  sortBtnActive: { backgroundColor: '#4f6ef7', borderColor: '#4f6ef7' },
  sortBtnText: { fontSize: 12, color: '#666', fontWeight: '600' },
  sortBtnTextActive: { color: '#fff' },

  // Category chips
  categoryScroll: { maxHeight: 44 },
  categoryContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e4f0',
  },
  catChipActive: { backgroundColor: '#1a1f36', borderColor: '#1a1f36' },
  catChipText: { fontSize: 12, color: '#555', fontWeight: '600' },
  catChipTextActive: { color: '#fff' },

  // List
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  image: { width: 88, height: 88 },
  imagePlaceholder: {
    width: 88,
    height: 88,
    backgroundColor: '#f0f2f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { fontSize: 28 },
  info: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  productName: { fontSize: 14, fontWeight: '700', color: '#1a1f36', marginBottom: 4 },
  tagRow: { flexDirection: 'row', marginBottom: 4 },
  tag: {
    backgroundColor: '#eef0fb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: { fontSize: 11, color: '#4f6ef7', fontWeight: '600' },
  price: { fontSize: 13, fontWeight: '700', color: '#e85555' },
  actions: {
    paddingRight: 10,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#eef0fb',
    width: 36, height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: { fontSize: 16 },
  deleteBtn: {
    backgroundColor: '#feeaea',
    width: 36, height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: { fontSize: 16 },

  // Empty / Loading
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#888' },
  emptyIcon: { fontSize: 52, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#333' },
  clearFilterBtn: {
    marginTop: 12,
    backgroundColor: '#4f6ef7',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearFilterText: { color: '#fff', fontWeight: '600' },

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 30,
    backgroundColor: '#4f6ef7',
    width: 60, height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f6ef7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 36 },
});
