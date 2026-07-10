import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AnimatedPressable } from "../../components/ui";
import {
  ChevronLeft,
  User,
  Lock,
  Moon,
  Bell,
} from "lucide-react-native";
import { haptics } from "../../utils/haptics";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { theme } from "../../theme/themes";
import { useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/mainSlice";
import { useDeleteAccountMutation } from "../../store/services/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";

type Props = NativeStackScreenProps<AppStackParamList, "Settings">;

const REMINDERS_KEY = "daily_reminders_enabled";

/** 34px tinted icon tile used on every settings row (F4 mock). */
function IconTile({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return <View style={[styles.iconTile, { backgroundColor: bg }]}>{children}</View>;
}

function Toggle({ on }: { on: boolean }) {
  return (
    <View style={[styles.toggle, on ? styles.toggleOn : styles.toggleOff]}>
      <View style={[styles.toggleKnob, on ? styles.knobOn : styles.knobOff]} />
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();
  const [remindersOn, setRemindersOn] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(REMINDERS_KEY)
      .then((v) => {
        if (v !== null) setRemindersOn(v === "true");
      })
      .catch(() => {});
  }, []);

  const toggleReminders = () => {
    haptics.light();
    setRemindersOn((prev) => {
      const next = !prev;
      AsyncStorage.setItem(REMINDERS_KEY, String(next)).catch(() => {});
      return next;
    });
  };

  const handleLogout = () => {
    haptics.heavy();
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    haptics.heavy();
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount().unwrap();
              dispatch(logout());
            } catch {
              Alert.alert("Error", "Failed to delete account. Try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => {
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <ChevronLeft color={theme.colors.text} size={18} strokeWidth={2.5} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ACCOUNT */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          <AnimatedPressable
            style={[styles.row, styles.rowBorder]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <IconTile bg="#123B34">
              <User color="#2CC9B5" size={15} strokeWidth={2.2} />
            </IconTile>
            <Text style={styles.rowLabel}>Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={styles.row}
            onPress={() => navigation.navigate("ChangePassword")}
          >
            <IconTile bg="#2A2440">
              <Lock color="#A78BFA" size={15} strokeWidth={2.2} />
            </IconTile>
            <Text style={styles.rowLabel}>Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </AnimatedPressable>
        </View>

        {/* PREFERENCES */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>PREFERENCES</Text>
        <View style={styles.sectionCard}>
          <View style={[styles.row, styles.rowBorder]}>
            <IconTile bg="#3A2F16">
              <Moon color="#EFB65A" size={15} strokeWidth={2.2} />
            </IconTile>
            <Text style={styles.rowLabel}>Theme</Text>
            <Text style={styles.rowValue}>Dark</Text>
            <Text style={[styles.chevron, { marginLeft: 8 }]}>›</Text>
          </View>
          <AnimatedPressable style={styles.row} onPress={toggleReminders}>
            <IconTile bg="#16303E">
              <Bell color="#6EC1E8" size={15} strokeWidth={2.2} />
            </IconTile>
            <Text style={styles.rowLabel}>Daily Reminders</Text>
            <Toggle on={remindersOn} />
          </AnimatedPressable>
        </View>

        {/* ABOUT */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>ABOUT</Text>
        <View style={styles.sectionCard}>
          <View style={styles.row}>
            <IconTile bg="#1E3238">
              <Text style={styles.infoIcon}>i</Text>
            </IconTile>
            <Text style={styles.rowLabel}>App Version</Text>
            <Text style={styles.versionValue}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer actions */}
      <View style={styles.footer}>
        <AnimatedPressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <Text style={styles.deleteText}>
            {isDeleting ? "DELETING…" : "DELETE ACCOUNT"}
          </Text>
        </AnimatedPressable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: "#5F7E7C",
    letterSpacing: 1.3,
    marginBottom: 8,
    marginLeft: 6,
  },
  sectionGap: {
    marginTop: 22,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 18,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 15,
    paddingHorizontal: 17,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1E3238",
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: {
    fontSize: 13,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.text,
  },
  rowValue: {
    fontSize: 12.5,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
  },
  versionValue: {
    fontSize: 12.5,
    fontFamily: "Nunito_700Bold",
    color: "#5F7E7C",
  },
  chevron: {
    fontSize: 16,
    fontFamily: "Nunito_800ExtraBold",
    color: "#5F7E7C",
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 14,
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: theme.colors.primary,
  },
  toggleOff: {
    backgroundColor: "#2C464C",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.text,
  },
  knobOn: {
    alignSelf: "flex-end",
    marginRight: 3,
  },
  knobOff: {
    alignSelf: "flex-start",
    marginLeft: 3,
  },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 34,
    gap: 11,
  },
  logoutBtn: {
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 14,
    fontFamily: "Nunito_900Black",
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  deleteBtn: {
    borderWidth: 2,
    borderColor: "#4A2229",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteText: {
    fontSize: 14,
    fontFamily: "Nunito_900Black",
    color: theme.colors.error,
    letterSpacing: 0.8,
  },
});
