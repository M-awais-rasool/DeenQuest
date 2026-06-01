import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BookOpen, Search } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { Loader } from "../../components/Loader";
import { theme } from "../../theme/themes";
import {
  QuranSurahSummary,
  useGetSurahsQuery,
} from "../../store/services/api";
import type { DemoTabScreenProps } from "../../navigators/navigationTypes";
import { haptics } from "../../utils/haptics";

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
    haptics.light();
    navigation.navigate("SurahDetail", { surahId: surah.id });
  };

  return (
    <ScreenWrapper>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>Quran</Text>
          <Text style={s.title}>Read & Listen</Text>
        </View>
        <View style={s.headerIcon}>
          <BookOpen size={24} color={theme.colors.primary} />
        </View>
      </View>

      <View style={s.searchWrap}>
        <Search size={18} color={theme.colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search Surah"
          placeholderTextColor={theme.colors.textMuted}
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
            <TouchableOpacity
              style={s.surahRow}
              onPress={() => handleOpen(item)}
              activeOpacity={0.78}
            >
              <View style={s.numberBadge}>
                <Text style={s.numberText}>{item.number}</Text>
              </View>
              <View style={s.surahInfo}>
                <Text style={s.surahName}>{item.english_name}</Text>
                <Text style={s.surahMeaning} numberOfLines={1}>
                  {item.english_name_translation}
                </Text>
              </View>
              <View style={s.trailing}>
                <Text style={s.arabicName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={s.metaText}>
                  {item.number_of_ayahs} ayahs • {item.revelation_type}
                </Text>
              </View>
            </TouchableOpacity>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary12,
    borderWidth: 1,
    borderColor: theme.colors.primary25,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLow,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    padding: 0,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
    gap: 10,
  },
  surahRow: {
    minHeight: 76,
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberBadge: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 15,
  },
  surahInfo: {
    flex: 1,
    minWidth: 0,
  },
  surahName: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
  surahMeaning: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  trailing: {
    alignItems: "flex-end",
    maxWidth: "38%",
  },
  arabicName: {
    color: theme.colors.secondary,
    fontSize: 17,
    fontWeight: "800",
    writingDirection: "rtl",
  },
  metaText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "right",
  },
  empty: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
  },
});
