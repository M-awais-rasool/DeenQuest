import {
  View,
  StyleSheet,
  Animated,
} from "react-native";
import { AnimatedPressable } from "../components/ui";
import { useRef, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import type { DemoTabParamList } from "./navigationTypes";
import { theme } from "../theme/themes";
import { HomeScreen } from "../screens/home/HomeScreen";
import { RewardsScreen } from "../screens/reward/RewardsScreen";

import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { LearnPathScreen } from "../screens/level/LearnPathScreen";
import { QuranHomeScreen } from "../screens/quran/QuranHomeScreen";

const Tab = createBottomTabNavigator<DemoTabParamList>();

/** Per-tab active pill colours, straight from the mockups. */
const TAB_CONFIG: {
  name: keyof DemoTabParamList;
  label: string;
  icon: LucideIcon;
  activeBg: string;
  activeBorder: string;
  activeFg: string;
}[] = [
  {
    name: "HomeScreen",
    label: "Home",
    icon: Home,
    activeBg: "#123B34",
    activeBorder: "#2CC9B5",
    activeFg: "#5EE0CE",
  },
  {
    name: "PathScreen",
    label: "Learn",
    icon: BookOpen,
    activeBg: "#2A2440",
    activeBorder: "#A78BFA",
    activeFg: "#C4B2FF",
  },
  {
    name: "QuranScreen",
    label: "Quran",
    icon: Book,
    activeBg: "#12303A",
    activeBorder: "#6EC1E8",
    activeFg: "#9AD5F2",
  },
  {
    name: "RewardsScreen",
    label: "Rewards",
    icon: Trophy,
    activeBg: "#3A2F16",
    activeBorder: "#EFB65A",
    activeFg: "#F5CE8A",
  },
  {
    name: "ProfileScreen",
    label: "Profile",
    icon: User,
    activeBg: "#3A2030",
    activeBorder: "#F27FB2",
    activeFg: "#F8A9CC",
  },
];

const INACTIVE_FG = "#5F7E7C";

const SPRING = { friction: 8, tension: 120, useNativeDriver: true };

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabCount = state.routes.length;

  const iconScales = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(1))
  ).current;
  const labelOpacities = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    for (let i = 0; i < tabCount; i++) {
      const isFocused = state.index === i;
      Animated.parallel([
        Animated.spring(iconScales[i], {
          toValue: isFocused ? 1.08 : 1,
          ...SPRING,
        }),
        Animated.timing(labelOpacities[i], {
          toValue: isFocused ? 1 : 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state.index, tabCount]);

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 14) }]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tabConf =
            TAB_CONFIG.find((t) => t.name === route.name) ?? TAB_CONFIG[0];
          const TabIcon = tabConf.icon;

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
            <AnimatedPressable
              key={route.key}
              style={[
                styles.tab,
                isFocused && {
                  backgroundColor: tabConf.activeBg,
                  borderColor: tabConf.activeBorder,
                },
              ]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Animated.View
                style={{ transform: [{ scale: iconScales[index] }] }}
              >
                <TabIcon
                  size={19}
                  color={isFocused ? tabConf.activeFg : INACTIVE_FG}
                  strokeWidth={isFocused ? 2.3 : 2.1}
                />
              </Animated.View>

              {isFocused && (
                <Animated.Text
                  style={[
                    styles.label,
                    {
                      color: tabConf.activeFg,
                      opacity: labelOpacities[index],
                    },
                  ]}
                >
                  {tabConf.label}
                </Animated.Text>
              )}
            </AnimatedPressable>
          );
        })}
      </View>
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
  wrapper: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(16,29,32,0.96)",
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 26,
    paddingVertical: 9,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 34,
    elevation: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  label: {
    fontSize: 12,
    fontFamily: "Nunito_900Black",
  },
});
