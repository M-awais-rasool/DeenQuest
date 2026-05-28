import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { theme } from "../../theme/themes";
import { COLORS, SCREEN_HEIGHT } from "./constants";

interface Props {
  animatedValue: Animated.Value;
}

export default function NoorCharacter({ animatedValue }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;

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
        { transform: [{ translateY }, { scale }], opacity },
      ]}
    >
      <View style={styles.circle}>
        <Image
          source={require("../../../assets/login-logo.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <View style={styles.glow} />
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
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.outline,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: 64,
    height: 64,
  },
  glow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white05,
    zIndex: -1,
  },
});
