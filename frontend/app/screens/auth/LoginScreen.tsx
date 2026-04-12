import React from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native"
import { Mail, Lock } from "lucide-react-native"
import { theme } from "@/theme/themes"
import { ScreenWrapper } from "@/components/ScreenWrapper"
import { TactileButton } from "@/components/TactileButton"

export const LoginScreen = () => {
  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0KUM9Libiyq9CVL_OQ56vXysNMfFF2vkAdutU1lTCGA07l7oM-zL2d-InVgAi1SO8rhzIzQ6SR6KVNGrLSEg2p8FYG7eJoIc5Ri6fRFqD_XgVMh57Edixloc2TGy05tLBGkapgj5igXd4BFwLSYgw9vGKOxvVLPXZBukwtp-34UckTpAYtasAcSiU_zj8GdUO-QI9e9m3p941BTJvOHEbPgmSGh5uhGh3XcyzQ2LsYqwENn5ibFhokiKaO6-oeBYgi5PcSyOSTYc",
              }}
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>DeenQuest</Text>
          <Text style={styles.subtitle}>Continue your sacred journey</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Mail size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
              />
              <Lock size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            </View>
          </View>

          <TactileButton title="Log In" onPress={() => {}} style={styles.loginButton} />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmiG0MrvGOU894QSX-OjzCECc48W32NiIZTykeXzLGO4rAoBQU_zz3QGP7Xwyd2AzYOXbd6wG_PKataGBqowMHDDCxIT5ACgpMQ2e-XXTI9FL6SYkoJ80DLYcCpZUtf4H-6S0fqnhXTJMVIgwNsOQbhRgEtjNtVXRUgUpVq6oXB7TOyk0FHmyXPZ6nCSBS68uCtXE_j7RYiefDUENCf7tHLE2TkwhthZuzJWNAc8vMo8u8kvZDAAEZArabaeFrLUA98WyWfoVp5V8",
                }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            New to DeenQuest? <Text style={styles.signUpText}>Sign Up</Text>
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.sm,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textMuted,
    fontWeight: "500",
    marginTop: 4,
  },
  formCard: {
    backgroundColor: "rgba(31, 31, 31, 0.6)",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(64, 73, 61, 0.1)",
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 4,
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.secondary,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: theme.colors.surfaceLow,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.outline,
    color: theme.colors.text,
    padding: 16,
    paddingRight: 48,
    borderRadius: theme.borderRadius.sm,
    fontSize: 16,
  },
  inputIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  loginButton: {
    marginTop: theme.spacing.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(64, 73, 61, 0.2)",
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "900",
    color: theme.colors.outline,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceHigh,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  footer: {
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontWeight: "500",
  },
  signUpText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
})
