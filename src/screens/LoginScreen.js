import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      let msg = 'Đăng nhập thất bại';
      if (error.code === 'auth/invalid-credential') msg = 'Email hoặc mật khẩu không đúng';
      else if (error.code === 'auth/user-not-found') msg = 'Tài khoản không tồn tại';
      else if (error.code === 'auth/too-many-requests') msg = 'Quá nhiều lần thử, thử lại sau';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    let inputEmail = email.trim();
    Alert.prompt(
      'Quên mật khẩu',
      'Nhập email để nhận link đặt lại mật khẩu:',
      async (value) => {
        const target = value?.trim() || inputEmail;
        if (!target) { Alert.alert('Lỗi', 'Vui lòng nhập email'); return; }
        try {
          await sendPasswordResetEmail(auth, target);
          Alert.alert('✅ Đã gửi', `Email đặt lại mật khẩu đã được gửi đến:\n${target}`);
        } catch (error) {
          let msg = 'Gửi email thất bại';
          if (error.code === 'auth/user-not-found') msg = 'Email này chưa được đăng ký';
          else if (error.code === 'auth/invalid-email') msg = 'Email không hợp lệ';
          Alert.alert('Lỗi', msg);
        }
      },
      'plain-text',
      inputEmail
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🛒</Text>
        </View>
        <Text style={styles.title}>Quản Lý Sản Phẩm</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@example.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity
              onPress={() => setShowPass(!showPass)}
              style={styles.eyeBtn}
            >
              <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Đăng Nhập</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>Chưa có tài khoản? </Text>
          <Text style={styles.linkBold}>Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f36',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 56,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1f36',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    padding: 10,
    marginLeft: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  btn: {
    backgroundColor: '#4f6ef7',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    backgroundColor: '#9aabf7',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#888',
    fontSize: 14,
  },
  linkBold: {
    color: '#4f6ef7',
    fontWeight: '700',
    fontSize: 14,
  },
  forgotBtn: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  forgotText: {
    color: '#4f6ef7',
    fontSize: 13,
    fontWeight: '600',
  },
});
