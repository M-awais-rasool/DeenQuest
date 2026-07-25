import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import {
  HifzSessionEngine,
  type SessionHeaderMeta,
} from "../../components/hifz/HifzSessionEngine";
import {
  HeartsChip,
  OutlineButton,
  RadialGlow,
  SessionHeader,
  StageRail,
  hz,
} from "../../components/hifz/ui";
import {
  useGetHifzSettingsQuery,
  useStartHifzSessionMutation,
  type HifzSessionView,
  type HifzStage,
} from "../../store/services/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "HifzSession">;

const PIPELINE: HifzStage[] = [
  "listen",
  "shadow",
  "open_recite",
  "challenges",
  "blind_recite",
];

export function HifzSessionScreen({ navigation, route }: Props) {
  const { portionId, queue } = route.params;
  const [startSession] = useStartHifzSessionMutation();
  const settingsQ = useGetHifzSettingsQuery();

  const [view, setView] = useState<HifzSessionView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<HifzStage>("listen");
  const [meta, setMeta] = useState<SessionHeaderMeta | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await startSession({ portionId, queue }).unwrap();
        if (cancelled) return;
        if (!res.data) {
          setError("Could not start this session.");
          return;
        }
        setView(res.data);
        setStage(res.data.session.stage);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.data?.error ?? "Could not start this session. Try again.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portionId, queue, startSession]);

  const reciterName = useMemo(() => {
    const id = view?.reciter_id;
    const match = settingsQ.data?.data?.reciters.find((r) => r.id === id);
    return match?.name ?? id ?? "Reciter";
  }, [settingsQ.data, view?.reciter_id]);

  const confirmQuit = () => {
    Alert.alert(
      "Leave this session?",
      "Your progress on this portion is saved up to the stage you finished.",
      [
        { text: "Keep going", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: () => navigation.goBack() },
      ],
    );
  };

  if (error) {
    return (
      <ScreenWrapper innerStyle={s.centerWrap}>
        <Text style={s.errorTitle}>Couldn't start</Text>
        <Text style={s.errorBody}>{error}</Text>
        <OutlineButton
          label="GO BACK"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 18, alignSelf: "stretch" }}
        />
      </ScreenWrapper>
    );
  }

  if (!view) {
    return (
      <ScreenWrapper innerStyle={s.centerWrap}>
        <ActivityIndicator color={hz.teal} />
        <Text style={s.loadingText}>Preparing your portion…</Text>
      </ScreenWrapper>
    );
  }

  const rail = PIPELINE.filter((st) => {
    if (st === "shadow") return view.preset.shadow_required;
    if (st === "blind_recite") return view.preset.blind_required_to_seal;
    return true;
  });

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      {stage === "blind_recite" && <RadialGlow tint="#1E1A0E" />}

      <SessionHeader
        onClose={confirmQuit}
        tag={meta?.tag?.label ?? ""}
        tagBg={meta?.tag?.bg ?? "transparent"}
        tagColor={meta?.tag?.color ?? hz.text}
        title={meta?.title ?? ""}
        sub={meta?.sub}
        right={
          meta?.hearts !== undefined ? <HeartsChip hearts={meta.hearts} /> : undefined
        }
      />

      <StageRail stages={rail} current={stage} showLabels={!!meta?.railLabels} />

      <View style={s.body}>
        <HifzSessionEngine
          view={view}
          reciterName={reciterName}
          onStageChange={setStage}
          onMeta={setMeta}
          onFinished={() =>
            navigation.replace("HifzResult", { sessionId: view.session.id })
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
    gap: 8,
  },
  loadingText: { fontFamily: "Nunito_600SemiBold", fontSize: 12.5, color: hz.faint },
  errorTitle: { fontFamily: "Nunito_900Black", fontSize: 18, color: hz.text },
  errorBody: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    lineHeight: 20,
    color: hz.muted,
    textAlign: "center",
  },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24 },
});

export default HifzSessionScreen;
