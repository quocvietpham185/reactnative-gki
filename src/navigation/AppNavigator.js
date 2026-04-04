import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

import LoginScreen from '../screens/LoginScreen';
import ProductListScreen from '../screens/ProductListScreen';
import AddEditProductScreen from '../screens/AddEditProductScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  if (user === undefined) return null; // Splash / đang kiểm tra auth

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {user ? (
          // Đã đăng nhập
          <>
            <Stack.Screen
              name="ProductList"
              component={ProductListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddEditProduct"
              component={AddEditProductScreen}
              options={({ route }) => ({
                title: route.params?.product ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm',
              })}
            />
          </>
        ) : (
          // Chưa đăng nhập
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const screenOptions = {
  headerStyle: { backgroundColor: '#1a1f36' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
  headerBackTitle: 'Quay lại',
};
