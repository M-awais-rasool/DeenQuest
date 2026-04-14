import { ComponentProps } from "react";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type DemoTabParamList = {
  PathScreen: undefined;
  HomeScreen: undefined;
  ProfileScreen: undefined;
  RewardsScreen: undefined;
  ReflectionScreen: undefined;
};

export type AppStackParamList = {
  Welcome: undefined;
  OnboardingScreen: undefined;
  Login: undefined;
  Signup: undefined;
  Demo: NavigatorScreenParams<DemoTabParamList>;
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
