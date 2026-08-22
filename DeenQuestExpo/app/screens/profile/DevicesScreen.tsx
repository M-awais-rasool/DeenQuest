import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Smartphone } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AnimatedPressable } from "../../components/ui";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { theme } from "../../theme/themes";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import {
  useGetSessionsQuery,
  useRevokeSessionMutation,
  type AuthSession,
} from "../../store/services/api";
import { readRefreshToken } from "../../store/storage/authStorage";

type Props = NativeStackScreenProps<AppStackParamList, "Devices">;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DevicesScreen({ navigation }: Props) {
  // Sent so the server can mark which row is the phone you are holding.
  const [currentToken, setCurrentToken] = useState<string | undefined>();
  useEffect(() => {
    readRefreshToken().then((token) => setCurrentToken(token ?? undefined));
  }, []);

  const { data, isLoading, isError, refetch } = useGetSessionsQuery(
    currentToken,
    { skip: currentToken === undefined },
  );
  const [revokeSession, { isLoading: isRevoking }] = useRevokeSessionMutation();

  const sessions = data?.data ?? [];

  const handleRevoke = useCallback(
    (session: AuthSession) => {
      Alert.alert(
        "Sign out this device?",
        "It will need to sign in again to use DeenQuest.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign out",
            style: "destructive",
            onPress: async () => {
              try {
                await revokeSession(session.id).unwrap();
                refetch();
              } catch {
                Alert.alert("Could not sign that device out", "Please try again.");
              }
            },
          },
        ],
      );
    },
    [refetch, revokeSession],
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Devices</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          These devices are signed in to your account. Sign out any you do not
          recognise.
        </Text>

        {isLoading && <ActivityIndicator color={theme.colors.primary} style={styles.loader} />}

        {isError && (
          <Text style={styles.empty}>Could not load your devices. Pull back and try again.</Text>
        )}

        {!isLoading && !isError && sessions.length === 0 && (
          <Text style={styles.empty}>No other devices are signed in.</Text>
        )}

        {sessions.map((session) => (
          <View key={session.id} style={styles.card}>
            <View style={styles.iconTile}>
              <Smartphone color="#2CC9B5" size={16} strokeWidth={2.2} />
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>
                {session.current ? "This device" : session.device_id || "Unknown device"}
              </Text>
              <Text style={styles.cardMeta}>
                Signed in {formatDate(session.created_at)}
              </Text>
            </View>

            {session.current ? (
              <Text style={styles.currentBadge}>CURRENT</Text>
            ) : (
              <AnimatedPressable
                onPress={() => handleRevoke(session)}
                disabled={isRevoking}
                style={styles.revokeButton}
              >
                <Text style={styles.revokeText}>SIGN OUT</Text>
              </AnimatedPressable>
            )}
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.surfaceLow,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scrollView: {},
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: 50,
  },
  intro: {
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
  },
  loader: {
    marginTop: theme.spacing.lg,
  },
  empty: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: theme.spacing.lg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.surfaceHigh,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    marginBottom: theme.spacing.sm,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#123B34",
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.text,
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
  },
  currentBadge: {
    fontSize: 10.5,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 1,
    color: "#2CC9B5",
  },
  revokeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  revokeText: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 1,
    color: theme.colors.error,
  },
});
