/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DemoNavigator } from './DemoNavigator';
import type { AppStackParamList, NavigationProps } from './navigationTypes';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { useAppSelector } from '../store/hooks';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { theme } from '../theme/themes';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => {
  const { isAuthenticated } = useAppSelector(state => state.main);

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
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export const AppNavigator = (props: NavigationProps) => {
  return (
    <NavigationContainer {...props}>
      <AppStack />
    </NavigationContainer>
  );
};
