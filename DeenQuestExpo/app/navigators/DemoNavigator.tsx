import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from "react-native";
import { useRef, useEffect } from "react";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import {
  Home,
  BookOpen,
  Book,
  User,
  type LucideIcon,
  Trophy,
} from "lucide-react-native";
import { haptics } from "../utils/haptics";
import type { DemoTabParamList } from "./navigationTypes";
import { theme } from "../theme/themes";
import { HomeScreen } from "../screens/home/HomeScreen";
import { RewardsScreen } from "../screens/reward/RewardsScreen";

import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { LearnPathScreen } from "../screens/level/LearnPathScreen";
import { QuranHomeScreen } from "../screens/quran/QuranHomeScreen";

const Tab = createBottomTabNavigator<DemoTabParamList>();

const TAB_CONFIG: {
  name: keyof DemoTabParamList;
  label: string;
  icon: LucideIcon;
}[] = [
  { name: "HomeScreen", label: "Home", icon: Home },
  { name: "PathScreen", label: "Learn", icon: BookOpen },
  { name: "QuranScreen", label: "Quran", icon: Book },
  { name: "RewardsScreen", label: "Rewards", icon: Trophy },
  { name: "ProfileScreen", label: "Profile", icon: User },
];

const SPRING = { friction: 8, tension: 120, useNativeDriver: true };

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const tabCount = state.routes.length;

  const iconScales = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(1))
  ).current;
  const labelOpacities = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(0.5))
  ).current;
  const indicatorScales = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    for (let i = 0; i < tabCount; i++) {
      const isFocused = state.index === i;
      Animated.parallel([
        Animated.spring(iconScales[i], {
          toValue: isFocused ? 1.1 : 1,
          ...SPRING,
        }),
        Animated.timing(labelOpacities[i], {
          toValue: isFocused ? 1 : 0.5,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(indicatorScales[i], {
          toValue: isFocused ? 1 : 0,
          ...SPRING,
        }),
      ]).start();
    }
  }, [state.index, tabCount]);

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tabConf = TAB_CONFIG.find((t) => t.name === route.name);
        const TabIcon = tabConf?.icon ?? Home;

        const onPress = () => {
          haptics.light();
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
            activeOpacity={0.7}
          >
            <Animated.View
              style={{
                transform: [{ scale: iconScales[index] }],
              }}
            >
              <TabIcon
                size={24}
                color={
                  isFocused ? theme.colors.primary : theme.colors.textMuted
                }
                strokeWidth={isFocused ? 2.5 : 2}
              />
            </Animated.View>

            <Animated.Text
              style={[
                styles.label,
                isFocused && styles.activeLabel,
                { opacity: labelOpacities[index] },
              ]}
            >
              {tabConf?.label}
            </Animated.Text>

            {/* Active indicator line */}
            <Animated.View
              style={[
                styles.indicator,
                {
                  transform: [{ scaleX: indicatorScales[index] }],
                },
              ]}
            />
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
      <Tab.Screen name="PathScreen" component={LearnPathScreen} />
      <Tab.Screen name="QuranScreen" component={QuranHomeScreen} />
      <Tab.Screen name="RewardsScreen" component={RewardsScreen} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
    paddingBottom: 24,
    paddingTop: 10,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minWidth: 56,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  activeLabel: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  indicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 2,
  },
});
