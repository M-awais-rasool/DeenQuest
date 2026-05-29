import React, { useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { haptics } from "../../utils/haptics";

interface Props {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  wrapperStyle?: any;
  rimStyle: any;
  capStyle: any;
  height: number;
}

export default function BikeHornWrapper({
  children,
  onPress,
  disabled,
  wrapperStyle,
  rimStyle,
  capStyle,
  height,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressDepth = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    haptics.selection(); 
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }),
      Animated.timing(pressDepth, {
        toValue: 4,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 120,
      }),
      Animated.spring(pressDepth, {
        toValue: 0,
        useNativeDriver: true,
        friction: 4,
        tension: 120,
      }),
    ]).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, wrapperStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.touchable, { height }]}
      >
        <View style={rimStyle} />
        <Animated.View style={[capStyle, { transform: [{ translateY: pressDepth }] }]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  touchable: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
});
