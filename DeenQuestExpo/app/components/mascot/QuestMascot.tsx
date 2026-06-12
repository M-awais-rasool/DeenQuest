import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Star, Sparkles } from "lucide-react-native";
import { theme } from "../../theme/themes";

const BODY_GRADIENT = ["#B5EFAC", "#88D982", "#56A452"] as const;
const ARM_COLOR = "#67BA62";
const FOOT_COLOR = "#4E8B4B";
const FACE_DARK = "#21351F";
const BLUSH = "rgba(255, 177, 199, 0.38)";

function useIdleLoops() {
  const bob = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const wave = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sine = Easing.inOut(Easing.sin);

    const loops = [
      // Floating bob — slow, weightless.
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, {
            toValue: 1,
            duration: 2400,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(bob, {
            toValue: 0,
            duration: 2400,
            easing: sine,
            useNativeDriver: true,
          }),
        ]),
      ),
      // Breathing — faster and subtler than the bob so they never sync.
      Animated.loop(
        Animated.sequence([
          Animated.timing(breath, {
            toValue: 1,
            duration: 1700,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(breath, {
            toValue: 0,
            duration: 1700,
            easing: sine,
            useNativeDriver: true,
          }),
        ]),
      ),
      // Blink — a quick single blink, then a double, on a long cycle.
      Animated.loop(
        Animated.sequence([
          Animated.delay(2300),
          Animated.timing(blink, {
            toValue: 0.08,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.delay(3100),
          Animated.timing(blink, {
            toValue: 0.08,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.delay(180),
          Animated.timing(blink, {
            toValue: 0.08,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 130,
            useNativeDriver: true,
          }),
        ]),
      ),
      // Wave — three friendly swings every few seconds.
      Animated.loop(
        Animated.sequence([
          Animated.delay(1100),
          Animated.timing(wave, {
            toValue: 1,
            duration: 240,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 0.25,
            duration: 220,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 1,
            duration: 220,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 0.25,
            duration: 220,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 1,
            duration: 220,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 0,
            duration: 320,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.delay(3600),
        ]),
      ),
      // Companion star twinkle.
      Animated.loop(
        Animated.sequence([
          Animated.timing(twinkle, {
            toValue: 1,
            duration: 1500,
            easing: sine,
            useNativeDriver: true,
          }),
          Animated.timing(twinkle, {
            toValue: 0,
            duration: 1500,
            easing: sine,
            useNativeDriver: true,
          }),
        ]),
      ),
    ];

    loops.forEach((l) => l.start());
    Animated.spring(entrance, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();

    return () => loops.forEach((l) => l.stop());
  }, [bob, breath, blink, wave, twinkle, entrance]);

  return { bob, breath, blink, wave, twinkle, entrance };
}

export const QuestMascot = memo(function QuestMascot({
  size = 220,
}: {
  size?: number;
}) {
  const { bob, breath, blink, wave, twinkle, entrance } = useIdleLoops();

  const body = size * 0.78;
  const armLength = size * 0.3;
  const armThickness = size * 0.105;

  const bodyTranslateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size * 0.05],
  });
  const breathScaleX = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });
  const breathScaleY = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.972],
  });
  const shadowScaleX = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });
  const shadowOpacity = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0.18],
  });
  const waveRotate = wave.interpolate({
    inputRange: [0, 1],
    outputRange: ["18deg", "-42deg"],
  });
  const starScale = twinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.12],
  });
  const starOpacity = twinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });
  const sparkleOpacity = twinkle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.3, 1],
  });
  const entranceScale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={[
        s.root,
        { width: size, height: size * 1.06 },
        { opacity: entrance, transform: [{ scale: entranceScale }] },
      ]}
    >
      {/* Ground shadow — shrinks and fades as the body floats up */}
      <Animated.View
        style={[
          s.groundShadow,
          {
            width: body * 0.66,
            height: body * 0.13,
            borderRadius: body,
            opacity: shadowOpacity,
            transform: [{ scaleX: shadowScaleX }],
          },
        ]}
      />

      {/* Floating group: arms + body + face move together */}
      <Animated.View
        style={[
          s.floating,
          {
            transform: [
              { translateY: bodyTranslateY },
              { scaleX: breathScaleX },
              { scaleY: breathScaleY },
            ],
          },
        ]}
      >
        {/* Companion star */}
        <Animated.View
          style={[
            s.companionStar,
            {
              top: -size * 0.045,
              right: -size * 0.02,
              opacity: starOpacity,
              transform: [{ scale: starScale }],
            },
          ]}
        >
          <Star
            size={size * 0.155}
            color={theme.colors.secondary}
            fill={theme.colors.secondary}
          />
        </Animated.View>
        <Animated.View
          style={[
            s.companionStar,
            { top: size * 0.14, left: -size * 0.06, opacity: sparkleOpacity },
          ]}
        >
          <Sparkles size={size * 0.09} color={theme.colors.primary50} />
        </Animated.View>

        {/* Left arm — resting */}
        <View
          style={[
            s.arm,
            {
              position: "absolute",
              width: armLength * 0.82,
              height: armThickness,
              borderRadius: armThickness,
              left: -armLength * 0.34,
              top: body * 0.56,
              transform: [{ rotate: "32deg" }],
              zIndex: 1,
            },
          ]}
        />

        {/* Right arm — waving. The wrapper is centred on the shoulder so
            the rotation pivots there instead of the arm's middle. */}
        <View
          style={[
            s.armPivot,
            {
              width: armLength * 2,
              height: armLength * 2,
              right: -armLength * 1.18,
              top: body * 0.52 - armLength,
            },
          ]}
        >
          <Animated.View
            style={{
              width: armLength * 2,
              height: armLength * 2,
              alignItems: "flex-end",
              justifyContent: "center",
              transform: [{ rotate: waveRotate }],
            }}
          >
            <View
              style={[
                s.arm,
                {
                  width: armLength,
                  height: armThickness,
                  borderRadius: armThickness,
                  // Span outward from the wrapper centre (the shoulder),
                  // with a small overlap so the base hides behind the body.
                  marginRight: armLength * 0.06,
                },
              ]}
            />
          </Animated.View>
        </View>

        {/* Feet */}
        <View
          style={[
            s.foot,
            {
              width: body * 0.2,
              height: body * 0.11,
              borderRadius: body,
              bottom: -body * 0.025,
              left: body * 0.2,
            },
          ]}
        />
        <View
          style={[
            s.foot,
            {
              width: body * 0.2,
              height: body * 0.11,
              borderRadius: body,
              bottom: -body * 0.025,
              right: body * 0.2,
            },
          ]}
        />

        {/* Body */}
        <View
          style={[
            s.body,
            { width: body, height: body, borderRadius: body / 2 },
          ]}
        >
          <LinearGradient
            colors={BODY_GRADIENT}
            start={{ x: 0.18, y: 0.08 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Gloss highlight (two stacked soft ellipses) */}
          <View
            style={[
              s.gloss,
              {
                width: body * 0.42,
                height: body * 0.3,
                borderRadius: body,
                top: body * 0.08,
                left: body * 0.12,
                transform: [{ rotate: "-24deg" }],
              },
            ]}
          />
          <View
            style={[
              s.glossSmall,
              {
                width: body * 0.16,
                height: body * 0.1,
                borderRadius: body,
                top: body * 0.13,
                left: body * 0.17,
                transform: [{ rotate: "-24deg" }],
              },
            ]}
          />

          {/* Face */}
          <View style={[s.face, { top: body * 0.3 }]}>
            <View style={s.eyeRow}>
              <Animated.View
                style={[
                  s.eye,
                  {
                    width: body * 0.105,
                    height: body * 0.15,
                    borderRadius: body,
                    transform: [{ scaleY: blink }],
                  },
                ]}
              >
                <View
                  style={[
                    s.eyeShine,
                    { width: body * 0.038, height: body * 0.038 },
                  ]}
                />
              </Animated.View>
              <Animated.View
                style={[
                  s.eye,
                  {
                    width: body * 0.105,
                    height: body * 0.15,
                    borderRadius: body,
                    marginLeft: body * 0.18,
                    transform: [{ scaleY: blink }],
                  },
                ]}
              >
                <View
                  style={[
                    s.eyeShine,
                    { width: body * 0.038, height: body * 0.038 },
                  ]}
                />
              </Animated.View>
            </View>

            {/* Blush */}
            <View
              style={[
                s.blush,
                {
                  width: body * 0.11,
                  height: body * 0.065,
                  borderRadius: body,
                  left: -body * 0.085,
                  top: body * 0.135,
                },
              ]}
            />
            <View
              style={[
                s.blush,
                {
                  width: body * 0.11,
                  height: body * 0.065,
                  borderRadius: body,
                  right: -body * 0.085,
                  top: body * 0.135,
                },
              ]}
            />

            {/* Smile */}
            <View
              style={[
                s.mouth,
                {
                  width: body * 0.2,
                  height: body * 0.11,
                  borderBottomLeftRadius: body,
                  borderBottomRightRadius: body,
                  marginTop: body * 0.055,
                },
              ]}
            >
              <View
                style={[
                  s.tongue,
                  {
                    width: body * 0.1,
                    height: body * 0.05,
                    borderTopLeftRadius: body,
                    borderTopRightRadius: body,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  floating: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  groundShadow: {
    position: "absolute",
    bottom: 0,
    backgroundColor: theme.colors.black,
  },
  companionStar: {
    position: "absolute",
    zIndex: 3,
  },
  armPivot: {
    position: "absolute",
    zIndex: 1,
  },
  arm: {
    position: "relative",
    backgroundColor: ARM_COLOR,
  },
  foot: {
    position: "absolute",
    backgroundColor: FOOT_COLOR,
    zIndex: 0,
  },
  body: {
    overflow: "hidden",
    marginBottom: 8,
    zIndex: 2,
  },
  gloss: {
    position: "absolute",
    backgroundColor: theme.colors.white10,
  },
  glossSmall: {
    position: "absolute",
    backgroundColor: theme.colors.white20,
  },
  face: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
  },
  eyeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  eye: {
    backgroundColor: FACE_DARK,
    overflow: "hidden",
  },
  eyeShine: {
    position: "absolute",
    top: "18%",
    right: "16%",
    borderRadius: 999,
    backgroundColor: theme.colors.white70,
  },
  blush: {
    position: "absolute",
    backgroundColor: BLUSH,
  },
  mouth: {
    backgroundColor: FACE_DARK,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  tongue: {
    backgroundColor: "#E58A8A",
  },
});

export default QuestMascot;
