import React, { useCallback } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { theme } from "../../theme/themes";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { ScreenWrapper } from "../../components/ScreenWrapper";

import type { CourseConfig } from "../../components/level/learn/types";
import { CoursesHeader } from "../../components/level/learn/CoursesHeader";
import { COURSES } from "../../components/level/learn/courseData";
import { CourseCard } from "../../components/level/learn/CourseCard";
import { CardConnector } from "../../components/level/learn/CardConnector";

export function LearnPathScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const handlePress = useCallback(
    (course: CourseConfig) => {
      if (course.status === "locked") return;
      if (course.id === "qaida") navigation.navigate("LevelMap");
    },
    [navigation],
  );

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <CoursesHeader />
        <View style={s.list}>
          {COURSES.map((course, index) => (
            <React.Fragment key={course.id}>
              <CourseCard
                course={course}
                index={index}
                onPress={() => handlePress(course)}
              />
              {index < COURSES.length - 1 && <CardConnector />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  content: {
    paddingBottom: 48,
    backgroundColor: theme.colors.background,
  },
  list: {
    paddingHorizontal: 16,
  },
});
