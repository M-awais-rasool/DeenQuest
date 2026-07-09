/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import type { LinkingOptions } from "@react-navigation/native";

import { DemoNavigator } from "./DemoNavigator";
import type { AppStackParamList, NavigationProps } from "./navigationTypes";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import type { MainState } from "../store/slices/mainSlice";
import { restoreAuth } from "../store/slices/mainSlice";
import { Loader } from "../components/Loader";
import {
  hasCompletedOnboarding as getOnboardingCompletionStatus,
  readPersistedAuth,
} from "../store/storage/authStorage";
import { DailyTaskDetailScreen } from "../screens/task/DailyTaskDetailScreen";
import { LevelDetailScreen } from "../screens/level/LevelDetailScreen";
import { LessonPlayerScreen } from "../screens/level/LessonPlayerScreen";
import { MiniGamePlayerScreen } from "../screens/level/MiniGamePlayerScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { ChangePasswordScreen } from "../screens/profile/ChangePasswordScreen";
import { PublicProfileScreen } from "../screens/profile/PublicProfileScreen";
import { LeaderboardScreen } from "../screens/leaderboard/LeaderboardScreen";
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import { SignupScreen } from "../screens/auth/SignupScreen";
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";
import { SurahDetailScreen } from "../screens/quran/SurahDetailScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

/** Deep linking configuration — maps URLs to screens.
 *  URL scheme: deenquest://
 *  Profile share link: deenquest://profile/<userId>
 */
const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ["deenquest://"],
  config: {
    screens: {
      Demo: {
        screens: {
          ProfileScreen: "my-profile",
          QuranScreen: "quran",
        },
      },
      PublicProfile: "profile/:userId",
      SurahDetail: "quran/surah/:surahId",
    },
  },
};

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
    return <Loader fullScreen />;
  }

  const initialRouteName = hasCompletedOnboarding
    ? isAuthenticated
      ? "Demo"
      : "Welcome"
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
          <Stack.Screen
            name="DailyTaskDetail"
            component={DailyTaskDetailScreen}
          />
          <Stack.Screen name="LevelDetail" component={LevelDetailScreen} />
          <Stack.Screen
            name="LessonPlayer"
            component={LessonPlayerScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="MiniGamePlayer"
            component={MiniGamePlayerScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="SurahDetail" component={SurahDetailScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
          />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />

        </>
      ) : (
        <>
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export const AppNavigator = (props: NavigationProps) => {
  return (
    <NavigationContainer linking={linking} {...props}>
      <AppStack />
    </NavigationContainer>
  );
};
