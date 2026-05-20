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
  Trophy,
  BarChart2,
  User,
  type LucideIcon,
} from "lucide-react-native";
import { haptics } from "../utils/haptics";
import type { DemoTabParamList } from "./navigationTypes";
import { theme } from "../theme/themes";
import { HomeScreen } from "../screens/home/HomeScreen";
import { RewardsScreen } from "../screens/reward/RewardsScreen";
import { LeaderboardScreen } from "../screens/leaderboard/LeaderboardScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { LearnPathScreen } from "../screens/level/LearnPathScreen";

const Tab = createBottomTabNavigator<DemoTabParamList>();

const TAB_CONFIG: {
  name: keyof DemoTabParamList;
  label: string;
  icon: LucideIcon;
}[] = [
  { name: "HomeScreen", label: "HOME", icon: Home },
  { name: "PathScreen", label: "LEARN", icon: BookOpen },
  { name: "RewardsScreen", label: "REWARDS", icon: Trophy },
  { name: "LeaderboardScreen", label: "RANK", icon: BarChart2 },
  { name: "ProfileScreen", label: "PROFILE", icon: User },
];

const SPRING = { friction: 8, tension: 120, useNativeDriver: true };

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const tabCount = state.routes.length;

  const iconScales = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(1))
  ).current;
  const iconTranslateYs = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(0))
  ).current;
  const labelOpacities = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(0.5))
  ).current;
  const bgScales = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(0.7))
  ).current;
  const bgOpacities = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(0))
  ).current;
  const indicatorScales = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    for (let i = 0; i < tabCount; i++) {
      const isFocused = state.index === i;
      Animated.parallel([
        Animated.spring(iconScales[i], {
          toValue: isFocused ? 1.14 : 1,
          ...SPRING,
        }),
        Animated.spring(iconTranslateYs[i], {
          toValue: isFocused ? -3 : 0,
          ...SPRING,
        }),
        Animated.timing(labelOpacities[i], {
          toValue: isFocused ? 1 : 0.45,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(bgScales[i], {
          toValue: isFocused ? 1 : 0.7,
          ...SPRING,
        }),
        Animated.timing(bgOpacities[i], {
          toValue: isFocused ? 1 : 0,
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
            {/* Icon wrapper with background pill */}
            <View style={styles.iconWrapper}>
              <Animated.View
                style={[
                  styles.activeBg,
                  {
                    opacity: bgOpacities[index],
                    transform: [{ scale: bgScales[index] }],
                  },
                ]}
              />
              <Animated.View
                style={{
                  transform: [
                    { scale: iconScales[index] },
                    { translateY: iconTranslateYs[index] },
                  ],
                }}
              >
                <TabIcon
                  size={24}
                  color={
                    isFocused ? theme.colors.primary : theme.colors.textMuted
                  }
                />
              </Animated.View>
            </View>

            {/* Label */}
            <Animated.Text
              style={[
                styles.label,
                isFocused && styles.activeLabel,
                { opacity: labelOpacities[index] },
              ]}
            >
              {tabConf?.label}
            </Animated.Text>
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
      <Tab.Screen name="RewardsScreen" component={RewardsScreen} />
      <Tab.Screen name="LeaderboardScreen" component={LeaderboardScreen} />
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
    paddingVertical: 4,
    minWidth: 56,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
  },
  activeBg: {
    position: "absolute",
    marginTop: -6,
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: theme.colors.primary10,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  activeLabel: {
    color: theme.colors.primary,
  },
  indicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 4,
  },
});
