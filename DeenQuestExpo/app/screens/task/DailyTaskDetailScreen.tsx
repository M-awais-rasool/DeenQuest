import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import { DailyTaskScreen } from "./DailyTaskScreen";

type Props = NativeStackScreenProps<AppStackParamList, "DailyTaskDetail">;

export function DailyTaskDetailScreen({ route, navigation }: Props) {
  return (
    <DailyTaskScreen
      task={route.params.task}
      onBack={() => navigation.goBack()}
    />
  );
}
