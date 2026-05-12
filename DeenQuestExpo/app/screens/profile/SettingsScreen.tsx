import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  ChevronRight,
  User,
  Lock,
  Bell,
  Moon,
  Info,
  LogOut,
  Trash2,
  ArrowLeft,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { theme } from "../../theme/themes";
import { useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/mainSlice";
import {
  useDeleteAccountMutation,
  useRegisterNotificationTokenMutation,
  useUnregisterNotificationTokenMutation,
} from "../../store/services/api";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigators/navigationTypes";
import {
  getExpoPushRegistrationAsync,
  getNotificationsEnabledPreference,
  getStoredExpoPushTokenAsync,
  setNotificationsEnabledPreference,
} from "../../services/notificationService";

type Props = NativeStackScreenProps<AppStackParamList, "Settings">;

interface SettingsItem {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  value?: string;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export function SettingsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();
  const [registerNotificationToken, { isLoading: isRegisteringToken }] =
    useRegisterNotificationTokenMutation();
  const [unregisterNotificationToken, { isLoading: isUnregisteringToken }] =
    useUnregisterNotificationTokenMutation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getNotificationsEnabledPreference().then((enabled) => {
      if (isMounted) {
        setNotificationsEnabled(enabled);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const unregisterCurrentToken = async () => {
    const expoPushToken = await getStoredExpoPushTokenAsync();
    if (!expoPushToken) return;

    await unregisterNotificationToken({
      expo_push_token: expoPushToken,
    }).unwrap();
  };

  const handleNotificationToggle = async () => {
    if (isRegisteringToken || isUnregisteringToken) return;

    try {
      if (notificationsEnabled) {
        await unregisterCurrentToken();
        await setNotificationsEnabledPreference(false);
        setNotificationsEnabled(false);
        return;
      }

      const result = await getExpoPushRegistrationAsync();
      if (result.status !== "registered") {
        Alert.alert("Notifications", result.message);
        return;
      }

      await registerNotificationToken(result.payload).unwrap();
      await setNotificationsEnabledPreference(true);
      setNotificationsEnabled(true);
    } catch {
      Alert.alert("Notifications", "Could not update notifications right now.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await unregisterCurrentToken();
          } finally {
            dispatch(logout());
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
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
              await unregisterCurrentToken();
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

  const sections: SettingsSection[] = [
    {
      title: "ACCOUNT",
      items: [
        {
          icon: <User color={theme.colors.text} size={20} />,
          label: "Edit Profile",
          onPress: () => navigation.navigate("EditProfile"),
        },
        {
          icon: <Lock color={theme.colors.text} size={20} />,
          label: "Change Password",
          onPress: () => navigation.navigate("ChangePassword"),
        },
      ],
    },
    {
      title: "PREFERENCES",
      items: [
        {
          icon: <Bell color={theme.colors.text} size={20} />,
          label: "Notifications",
          value: notificationsEnabled ? "On" : "Off",
          onPress: handleNotificationToggle,
        },
        {
          icon: <Moon color={theme.colors.text} size={20} />,
          label: "Theme",
          value: "Dark",
          onPress: () => {},
        },
      ],
    },
    {
      title: "ABOUT",
      items: [
        {
          icon: <Info color={theme.colors.text} size={20} />,
          label: "App Version",
          value: "1.0.0",
          onPress: () => {},
        },
      ],
    },
    {
      title: "",
      items: [
        {
          icon: <LogOut color={theme.colors.error} size={20} />,
          label: "Log Out",
          onPress: handleLogout,
          danger: true,
        },
        {
          icon: <Trash2 color={theme.colors.error} size={20} />,
          label: "Delete Account",
          onPress: handleDeleteAccount,
          danger: true,
        },
      ],
    },
  ];

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, sectionIdx) => (
          <View key={sectionIdx} style={styles.section}>
            {section.title !== "" && (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  style={[
                    styles.settingsRow,
                    itemIdx < section.items.length - 1 && styles.rowBorder,
                  ]}
                  onPress={item.onPress}
                  disabled={
                    (isDeleting && item.label === "Delete Account") ||
                    ((isRegisteringToken || isUnregisteringToken) &&
                      item.label === "Notifications")
                  }
                >
                  <View style={styles.rowLeft}>
                    {item.icon}
                    <Text
                      style={[
                        styles.rowLabel,
                        item.danger && styles.dangerText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.rowRight}>
                    {item.value && (
                      <Text style={styles.rowValue}>{item.value}</Text>
                    )}
                    {!item.danger && (
                      <ChevronRight color={theme.colors.textMuted} size={18} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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
    fontWeight: "900",
    color: theme.colors.text,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scrollView: {},
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 50,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.black20,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceHigh,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowValue: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  dangerText: {
    color: theme.colors.error,
  },
});
