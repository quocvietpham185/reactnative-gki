import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthProvider, useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProductListScreen from '../screens/ProductListScreen';
import AddEditProductScreen from '../screens/AddEditProductScreen';
import AIGenerateScreen from '../screens/AIGenerateScreen';

const Stack = createStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {user ? (
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
          <Stack.Screen
            name="AIGenerate"
            component={AIGenerateScreen}
            options={{ title: '✨ AI Tạo Sản Phẩm' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const screenOptions = {
  headerStyle: { backgroundColor: '#1a1f36' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
  headerBackTitle: 'Quay lại',
};
