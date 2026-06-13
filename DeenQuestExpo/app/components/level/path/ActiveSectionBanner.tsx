import React, { memo, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { SectionHeader } from "./SectionHeader";
import type { PathSection } from "./types";

interface ActiveSectionBannerProps {
  /** The section the user is currently scrolled into. */
  section: PathSection;
}

export const ActiveSectionBanner = memo(function ActiveSectionBanner({
  section,
}: ActiveSectionBannerProps) {
  const [displayed, setDisplayed] = useState<PathSection>(section);

  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (section.index === displayed.index) {
      setDisplayed(section);
      return;
    }

    const goingDown = section.index > displayed.index;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: goingDown ? -12 : 12,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setDisplayed(section);
      translateY.setValue(goingDown ? 12 : -12);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [section]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <SectionHeader key={displayed.index} section={displayed} />
    </Animated.View>
  );
});
