/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Text, View } from 'react-native';
import { useEffect } from 'react';

import { DemoNavigator } from './DemoNavigator';
import type { AppStackParamList, NavigationProps } from './navigationTypes';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { restoreAuth } from '../store/slices/mainSlice';
import { theme } from '../theme/themes';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.main);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        dispatch(restoreAuth({ token, user: null }));
      } catch {
        dispatch(restoreAuth({ token: null, user: null }));
      }
    };

    bootstrapAuth();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Preparing your journey...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isAuthenticated ? 'Demo' : 'Login'}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Demo" component={DemoNavigator} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export const AppNavigator = (props: NavigationProps) => {
  return (
    <NavigationContainer {...props} >
      <AppStack />
    </NavigationContainer>
  );
};

const styles = {
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.colors.background,
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
};
