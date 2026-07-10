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
import { NotificationBootstrap } from "./app/components/NotificationBootstrap";
import { AppNavigator } from "./app/navigators/AppNavigator";
import { store } from "./app/store";

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider
        initialMetrics={initialWindowMetrics}
        style={{ flex: 1 }}
      >
        {/* <KeyboardProvider> */}
        <AppNavigator />
        <NotificationBootstrap />
        {/* </KeyboardProvider> */}
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
