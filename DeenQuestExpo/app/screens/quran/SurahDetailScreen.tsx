import React, { useEffect, useMemo } from "react";
import TrackPlayer from "react-native-track-player";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AnimatedPressable, TactilePressable } from "../../components/ui";
import { ArrowLeft, Languages } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { theme } from "../../theme/themes";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import {
  useGetSurahAudioQuery,
  useGetSurahByIdQuery,
} from "../../store/services/api";
import { SyncedSurahReader } from "../../components/quran/SyncedSurahReader";
import { BASMALAH } from "../../components/quran/constants";
import { useQuranFont } from "../../hooks/useQuranFont";

type Props = NativeStackScreenProps<AppStackParamList, "SurahDetail">;

const TRANSLATION_EDITION = "en.asad";

export const SurahDetailScreen = ({ route, navigation }: Props) => {
  const [showTranslation, setShowTranslation] = React.useState(false);
  const { fontFamily } = useQuranFont();
  const surahId = Number(route.params.surahId);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      TrackPlayer.reset();
    });
    return unsubscribe;
  }, [navigation]);
  const isValidSurah = Number.isInteger(surahId) && surahId >= 1 && surahId <= 114;
  const queryArgs = useMemo(
    () => ({
      id: isValidSurah ? surahId : 1,
      translation: showTranslation ? TRANSLATION_EDITION : undefined,
    }),
    [isValidSurah, showTranslation, surahId],
  );

  const { data, isLoading } = useGetSurahByIdQuery(queryArgs, {
    skip: !isValidSurah,
  });
  const { data: audioData, isLoading: audioLoading } =
    useGetSurahAudioQuery(isValidSurah ? surahId : 1, { skip: !isValidSurah });

  const surah = data?.data;
  const rawAyahs = surah?.ayahs ?? [];

  const { ayahs, showBasmalah } = useMemo(() => {
    if (rawAyahs.length === 0) return { ayahs: [], showBasmalah: false };
    const hasBasmalah =
      surahId !== 1 && surahId !== 9 && rawAyahs[0].text.startsWith(BASMALAH);
    if (!hasBasmalah) return { ayahs: rawAyahs, showBasmalah: false };
    return {
      ayahs: rawAyahs.map((ayah, i) =>
        i === 0 ? { ...ayah, text: ayah.text.replace(BASMALAH, "").trim() } : ayah,
      ),
      showBasmalah: true,
    };
  }, [rawAyahs, surahId]);

  if (!isValidSurah) {
    return (
      <ScreenWrapper>
        <View style={s.topBar}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <ArrowLeft size={22} color={theme.colors.text} />
          </AnimatedPressable>
        </View>
        <View style={s.errorState}>
          <Text style={s.errorTitle}>Surah not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (isLoading && !surah) {
    return (
      <ScreenWrapper>
        <View style={s.topBar}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={s.backBtn}>
            <ArrowLeft size={22} color={theme.colors.text} />
          </AnimatedPressable>
        </View>
        <Loader />
      </ScreenWrapper>
    );
  }

  const revelationLabel =
    surah?.revelation_type === "Meccan" || surah?.revelation_type === "meccan"
      ? "Meccan"
      : "Medinan";

  return (
    <ScreenWrapper style={{ position: "relative" }} innerStyle={{ flex: 1 }}>
      <View style={s.topBar}>
        <AnimatedPressable
          onPress={() => {
            navigation.goBack();
          }}
          style={s.backBtn}
        >
          <ArrowLeft size={22} color={theme.colors.text} />
        </AnimatedPressable>
        <TactilePressable
          onPress={() => setShowTranslation((value) => !value)}
          edgeColor="#24505F"
          depth={3}
          radius={14}
          haptic="selection"
          faceStyle={[s.translateBtn, showTranslation && s.translateBtnActive]}
        >
          <Languages
            size={16}
            color={showTranslation ? "#0E2A3A" : "#9AD5F2"}
          />
          <Text
            style={[
              s.translateText,
              showTranslation && s.translateTextActive,
            ]}
          >
            EN
          </Text>
        </TactilePressable>
      </View>

      {surah && (
        <SyncedSurahReader
          surah={surah}
          ayahs={ayahs}
          syncAyahs={rawAyahs}
          audio={audioData?.data}
          loadingAudio={audioLoading}
          showBasmalah={showBasmalah}
          showTranslation={showTranslation}
          fontFamily={fontFamily}
          revelationLabel={revelationLabel}
        />
      )}
    </ScreenWrapper>
  );
};

const s = StyleSheet.create({
  topBar: {
    paddingHorizontal: 22,
    paddingVertical: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  translateBtn: {
    height: 42,
    borderRadius: 14,
    backgroundColor: "#12303A",
    borderWidth: 1.5,
    borderColor: "#6EC1E8",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  translateBtnActive: {
    backgroundColor: "#6EC1E8",
    borderColor: "#6EC1E8",
  },
  translateText: {
    color: "#9AD5F2",
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  translateTextActive: {
    color: "#0E2A3A",
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  errorTitle: {
    color: theme.colors.error,
    fontSize: 18,
    fontFamily: "Nunito_900Black",
  },
});
