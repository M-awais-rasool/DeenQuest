import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { NotificationBootstrap } from "./app/components/NotificationBootstrap";
import { AppNavigator } from "./app/navigators/AppNavigator";
import { store } from "./app/store";

function App() {
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
