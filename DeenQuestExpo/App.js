import { useCallback, useEffect, useState } from "react";
import {
  Amiri_400Regular,
  Amiri_700Bold,
} from "@expo-google-fonts/amiri";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from "@expo-google-fonts/nunito";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Provider } from "react-redux";
import * as SplashScreen from "expo-splash-screen";
import { NotificationBootstrap } from "./app/components/NotificationBootstrap";
import { AppIconController } from "./app/components/AppIconController";
import { AppSplash } from "./app/components/AppSplash";
import { AppNavigator } from "./app/navigators/AppNavigator";
import { store } from "./app/store";

SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_MS = 2000;

function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Amiri_400Regular,
    Amiri_700Bold,
  });

  const [minElapsed, setMinElapsed] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  const appReady = fontsLoaded && minElapsed;

  const onSplashLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider
        initialMetrics={initialWindowMetrics}
        style={{ flex: 1 }}
      >
        {/* <KeyboardProvider> */}
        {appReady && (
          <>
            <AppNavigator />
            <NotificationBootstrap />
            <AppIconController />
          </>
        )}
        {!splashDone && (
          <AppSplash
            appReady={appReady}
            onDone={() => setSplashDone(true)}
            onLayout={onSplashLayout}
          />
        )}
        {/* </KeyboardProvider> */}
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
