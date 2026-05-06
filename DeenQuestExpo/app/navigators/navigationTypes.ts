import { ComponentProps } from "react";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CourseType, DailyTask } from "../store/services/api";

export type DemoTabParamList = {
  PathScreen: undefined;
  HomeScreen: undefined;
  ProfileScreen: undefined;
  RewardsScreen: undefined;
  LeaderboardScreen: undefined;
};

export type AppStackParamList = {
  Welcome: undefined;
  OnboardingScreen: undefined;
  Login: undefined;
  Signup: undefined;
  Demo: NavigatorScreenParams<DemoTabParamList>;
  DailyTaskDetail: { task: DailyTask };
  LevelMap:
    | { courseType?: CourseType; courseTitle?: string; courseSubtitle?: string }
    | undefined;
  LevelDetail: { levelId: number; courseType?: CourseType };
  LessonPlayer: {
    levelId: number;
    startLessonIndex: number;
    courseType?: CourseType;
  };
  MiniGamePlayer: { levelId: number; courseType?: CourseType };
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  PublicProfile: { userId: string };
};

export type AppStackScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

export type DemoTabScreenProps<T extends keyof DemoTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<DemoTabParamList, T>,
    AppStackScreenProps<keyof AppStackParamList>
  >;

export interface NavigationProps extends Partial<
  ComponentProps<typeof NavigationContainer<AppStackParamList>>
> {}
