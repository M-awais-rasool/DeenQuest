import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
} from "react-native";
import { useRef, useEffect, memo } from "react";
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
import { haptics } from "../utils/haptics";
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
const TRANSPARENT = "rgba(0,0,0,0)";

/** Room the label needs when the pill is expanded ("Rewards" is widest). */
const LABEL_MAX_WIDTH = 64;

/**
 * One animated tab. Two animation channels that never share a node:
 *  - `focus`   (JS driver)     → pill colours, label reveal (width/opacity/x)
 *  - `bounce*` (native driver) → icon scale-pop + little hop on activation
 */
const TabItem = memo(function TabItem({
  conf,
  isFocused,
  onPress,
}: {
  conf: (typeof TAB_CONFIG)[number];
  isFocused: boolean;
  onPress: () => void;
}) {
  const TabIcon = conf.icon;

  const focus = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const bounceScale = useRef(new Animated.Value(1)).current;
  const bounceY = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const mounted = useRef(false);

  useEffect(() => {
    // Pill expand/collapse + colour fade (layout props → JS driver).
    Animated.timing(focus, {
      toValue: isFocused ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Icon celebration on activation only (skip the initial mount so the
    // restored tab doesn't pop on app start).
    if (isFocused && mounted.current) {
      bounceScale.setValue(1);
      bounceY.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(bounceScale, {
            toValue: 1.28,
            friction: 5,
            tension: 300,
            useNativeDriver: true,
          }),
          Animated.spring(bounceScale, {
            toValue: 1,
            friction: 5,
            tension: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bounceY, {
            toValue: -5,
            duration: 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(bounceY, {
            toValue: 0,
            friction: 4,
            tension: 220,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const backgroundColor = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [TRANSPARENT, conf.activeBg],
  });
  const borderColor = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [TRANSPARENT, conf.activeBorder],
  });
  const labelMaxWidth = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LABEL_MAX_WIDTH],
  });
  const labelMargin = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 7],
  });
  const labelOpacity = focus.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });
  const labelShift = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.92,
      friction: 6,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={6}
    >
      <Animated.View
        style={[styles.tab, { backgroundColor, borderColor }]}
      >
        <Animated.View
          style={{
            transform: [
              { scale: Animated.multiply(bounceScale, pressScale) },
              { translateY: bounceY },
            ],
          }}
        >
          <TabIcon
            size={19}
            color={isFocused ? conf.activeFg : INACTIVE_FG}
            strokeWidth={isFocused ? 2.3 : 2.1}
          />
        </Animated.View>

        <Animated.Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[
            styles.label,
            {
              color: conf.activeFg,
              maxWidth: labelMaxWidth,
              marginLeft: labelMargin,
              opacity: labelOpacity,
              transform: [{ translateX: labelShift }],
            },
          ]}
        >
          {conf.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
});

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 14) }]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const conf =
            TAB_CONFIG.find((t) => t.name === route.name) ?? TAB_CONFIG[0];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              haptics.light();
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              conf={conf}
              isFocused={isFocused}
              onPress={onPress}
            />
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
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "transparent",
    overflow: "hidden",
  },
  label: {
    fontSize: 12,
    fontFamily: "Nunito_900Black",
  },
});
