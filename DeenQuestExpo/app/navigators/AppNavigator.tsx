/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useEffect, useState } from "react";

import { DemoNavigator } from "./DemoNavigator";
import type { AppStackParamList, NavigationProps } from "./navigationTypes";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { SignupScreen } from "../screens/auth/SignupScreen";
import type { RootState } from "../store/store";
import type { MainState } from "../store/slices/mainSlice";
import { theme } from "../theme/themes";
import { restoreAuth } from "../store/slices/mainSlice";
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import {
  hasCompletedOnboarding as getOnboardingCompletionStatus,
  readPersistedAuth,
} from "../store/storage/authStorage";
import { DailyTaskDetailScreen } from "../screens/task/DailyTaskDetailScreen";
import { LevelDetailScreen } from "../screens/level/LevelDetailScreen";
import { LessonPlayerScreen } from "../screens/level/LessonPlayerScreen";
import { MiniGamePlayerScreen } from "../screens/level/MiniGamePlayerScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppStack = () => {
  const dispatch = useAppDispatch();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);
  const { isAuthenticated, isLoading } = useAppSelector(
    (state: RootState) => (state as RootState & { main: MainState }).main,
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const [authState, onboardingComplete] = await Promise.all([
          readPersistedAuth(),
          getOnboardingCompletionStatus(),
        ]);

        if (!isMounted) {
          return;
        }

        setHasCompletedOnboarding(onboardingComplete);

        if (authState.token && authState.isAuthenticated) {
          dispatch(
            restoreAuth({ token: authState.token, user: authState.user }),
          );
          return;
        }

        dispatch(restoreAuth({ token: null, user: null }));
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setHasCompletedOnboarding(false);
        dispatch(restoreAuth({ token: null, user: null }));
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (isLoading || hasCompletedOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const initialRouteName = hasCompletedOnboarding
    ? isAuthenticated
      ? "Demo"
      : "Login"
    : "OnboardingScreen";

  return (
    <Stack.Navigator
      id="root-stack"
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={initialRouteName}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Demo" component={DemoNavigator} />
          <Stack.Screen name="DailyTaskDetail" component={DailyTaskDetailScreen} />
          <Stack.Screen name="LevelDetail" component={LevelDetailScreen} />
          <Stack.Screen name="LessonPlayer" component={LessonPlayerScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="MiniGamePlayer" component={MiniGamePlayerScreen} options={{ gestureEnabled: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
});
