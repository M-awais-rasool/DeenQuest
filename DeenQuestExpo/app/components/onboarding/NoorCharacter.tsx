import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { theme } from "../../theme/themes";
import { COLORS, SCREEN_HEIGHT } from "./constants";

interface Props {
  animatedValue: Animated.Value;
  size?: "normal" | "large";
  containerStyle?: object;
}

export default function NoorCharacter({ animatedValue, size = "normal", containerStyle }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  const dimensions = size === "large" ? { circle: 120, image: 96 } : { circle: 80, image: 64 };

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const translateY = Animated.add(
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [SCREEN_HEIGHT * 0.4, 0],
      extrapolate: "clamp",
    }),
    floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6],
    })
  );

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.5, 1.05, 1],
    extrapolate: "clamp",
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.container,
        size === "large" && styles.containerLarge,
        { transform: [{ translateY }, { scale }], opacity },
        containerStyle,
      ]}
    >
      <View style={[styles.circle, { width: dimensions.circle, height: dimensions.circle, borderRadius: dimensions.circle / 2 }]}>
        <Image
          source={require("../../../assets/login-logo.png")}
          style={{ width: dimensions.image, height: dimensions.image }}
          resizeMode="contain"
        />
      </View>
      <View style={[styles.glow, { width: dimensions.circle, height: dimensions.circle, borderRadius: dimensions.circle / 2 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 150,
    left: 10,
    zIndex: 10,
  },
  containerLarge: {
    position: "relative",
    top: undefined,
    left: undefined,
    zIndex: undefined,
    alignSelf: "center",
  },
  circle: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.outline,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    backgroundColor: theme.colors.white05,
    zIndex: -1,
  },
});
