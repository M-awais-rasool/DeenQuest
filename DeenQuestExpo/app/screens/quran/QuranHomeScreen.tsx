import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatedPressable } from "../../components/ui";
import { Search } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { theme } from "../../theme/themes";
import {
  QuranSurahSummary,
  useGetSurahsQuery,
} from "../../store/services/api";
import type { DemoTabScreenProps } from "../../navigators/navigationTypes";

type Props = DemoTabScreenProps<"QuranScreen">;

export const QuranHomeScreen = ({ navigation }: Props) => {
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching, refetch } = useGetSurahsQuery();

  const surahs = data?.data ?? [];
  const filteredSurahs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return surahs;
    return surahs.filter((surah) => {
      return (
        surah.english_name.toLowerCase().includes(query) ||
        surah.english_name_translation.toLowerCase().includes(query) ||
        String(surah.number).includes(query)
      );
    });
  }, [search, surahs]);

  const handleOpen = (surah: QuranSurahSummary) => {
    navigation.navigate("SurahDetail", { surahId: surah.id });
  };

  return (
    <ScreenWrapper>
      <View style={s.header}>
        <Text style={s.title}>The Holy Qur'an</Text>
        <Text style={s.subtitle}>114 surahs · read & listen</Text>
      </View>

      <View style={s.searchWrap}>
        <Search size={17} color="#5F7E7C" strokeWidth={2.4} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search Surah"
          placeholderTextColor="#5F7E7C"
          style={s.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isLoading ? (
        <Loader />
      ) : (
        <FlatList
          data={filteredSurahs}
          keyExtractor={(item) => String(item.id)}
          refreshing={isFetching}
          onRefresh={refetch}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AnimatedPressable
              style={s.surahRow}
              onPress={() => handleOpen(item)}
              haptic="light"
            >
              <View style={s.numberBadge}>
                <Text style={s.numberText}>{item.number}</Text>
              </View>
              <View style={s.surahInfo}>
                <Text style={s.surahName}>{item.english_name}</Text>
                <Text style={s.surahMeta} numberOfLines={1}>
                  {item.number_of_ayahs} ayahs · {item.revelation_type}
                </Text>
              </View>
              <Text style={s.arabicName} numberOfLines={1}>
                {item.name}
              </Text>
            </AnimatedPressable>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>No Surahs found.</Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
};

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontFamily: "Nunito_900Black",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13.5,
    fontFamily: "Nunito_600SemiBold",
    marginTop: 3,
  },
  searchWrap: {
    marginHorizontal: 22,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingVertical: 14,
    gap: 11,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 120,
  },
  surahRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  numberBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#12303A",
    borderWidth: 1.5,
    borderColor: "#24505F",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  numberText: {
    color: "#6EC1E8",
    fontFamily: "Nunito_900Black",
    fontSize: 14,
    transform: [{ rotate: "-45deg" }],
  },
  surahInfo: {
    flex: 1,
    minWidth: 0,
  },
  surahName: {
    color: theme.colors.text,
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15.5,
  },
  surahMeta: {
    color: "#5F7E7C",
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    marginTop: 2,
  },
  arabicName: {
    color: theme.colors.textMuted,
    fontSize: 22,
    fontFamily: "Amiri_700Bold",
    writingDirection: "rtl",
    maxWidth: "34%",
  },
  empty: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontFamily: "Nunito_700Bold",
  },
});
