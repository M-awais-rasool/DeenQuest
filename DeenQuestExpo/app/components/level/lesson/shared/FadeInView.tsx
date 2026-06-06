import React from "react";
import { Animated, ViewStyle, StyleProp } from "react-native";
import { useEntrance } from "./animations";

/**
 * Wraps children in a staggered upward fade-in entrance.
 * Drop-in replacement for a <View> in lesson components.
 */
export function FadeInView({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const entrance = useEntrance(delay);
  return <Animated.View style={[style, entrance]}>{children}</Animated.View>;
}

export default FadeInView;
