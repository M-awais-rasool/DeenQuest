import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import type { DemoTabParamList } from "./navigationTypes";
import { Icon } from "../components/Icon";
import { theme } from "../theme/themes";
import { HomeScreen } from "../screens/home/HomeScreen";
import { RewardsScreen } from "../screens/reward/RewardsScreen";
import { ReflectionScreen } from "../screens/reflection/ReflectionScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { PathScreen } from "../screens/path/PathScreen";
import { LevelMapScreen } from "../screens/level/LevelMapScreen";

const Tab = createBottomTabNavigator<DemoTabParamList>();

const TAB_CONFIG = [
  { name: "HomeScreen", label: "HOME", icon: "home" },
  { name: "PathScreen", label: "LEARN", icon: "learn" },
  { name: "RewardsScreen", label: "REWARDS", icon: "reward" },
  { name: "ReflectionScreen", label: "REFLECTION", icon: "reflection" },
  { name: "ProfileScreen", label: "PROFILE", icon: "profile" },
] as const;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tabConf = TAB_CONFIG.find((t) => t.name === route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
          >
            <View
              style={[
                styles.iconContainer,
                isFocused && styles.activeIconContainer,
              ]}
            >
              <Icon
                icon={tabConf?.icon ?? "home"}
                size={24}
                color={
                  isFocused ? theme.colors.primary : theme.colors.textMuted
                }
              />
            </View>
            <Text style={[styles.label, isFocused && styles.activeLabel]}>
              {tabConf?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function DemoNavigator() {
  return (
    <Tab.Navigator
      id="demo-tabs"
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      <Tab.Screen name="PathScreen" component={LevelMapScreen} />
      <Tab.Screen name="RewardsScreen" component={RewardsScreen} />
      <Tab.Screen name="ReflectionScreen" component={ReflectionScreen} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderTopWidth: 4,
    borderTopColor: theme.colors.surface,
    paddingBottom: 20,
    paddingTop: 10,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 16,
  },
  activeIconContainer: {
    backgroundColor: "rgba(136, 217, 130, 0.1)",
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primary,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  activeLabel: {
    color: theme.colors.primary,
  },
});
