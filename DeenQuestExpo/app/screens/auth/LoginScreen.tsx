import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Mail, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { TactileButton } from "../../components/TactileButton";
import { LoginRequest, useLoginMutation } from "../../store/services/api";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { RootState } from "../../store/store";
import { AppStackParamList } from "../../navigators/navigationTypes";
import {
  setAccessToken,
  setError,
  setIsAuthenticated,
  setUser,
} from "../../store/slices/mainSlice";
import type { MainState } from "../../store/slices/mainSlice";
import { theme } from "../../theme/themes";

type LoginScreenProps = NativeStackScreenProps<AppStackParamList, "Login">;

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const { error: reduxError } = useAppSelector(
    (state: RootState) => (state as RootState & { main: MainState }).main,
  );

  const [form, setForm] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    dispatch(setError(null));
  };

  const validate = () => {
    let valid = true;
    let newErrors = { email: "", password: "" };

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    if (!form.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const result = await login(form).unwrap();

      if (result.data) {
        dispatch(setUser(result.data.user));
        dispatch(setAccessToken(result.data.access_token));
        dispatch(setIsAuthenticated(true));
        dispatch(setError(null));
      }
    } catch (err: any) {
      const validationErrors = err?.data?.errors as string[] | undefined;
      const errorMessage =
        err?.data?.error ||
        validationErrors?.[0] ||
        "Login failed. Please try again.";
      dispatch(setError(errorMessage));
    }
  };

  const displayError =
    reduxError ||
    (error as any)?.data?.error ||
    ((error as any)?.data?.errors as string[] | undefined)?.[0];

  return (
    <ScreenWrapper>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroRow}>
          <Image
            source={require("../../../assets/icons/new-logo.png")}
            style={{ width: 100, height: 100 }}
          />
          <View style={styles.heroBadge}>
            <Sparkles size={14} color={theme.colors.onSecondary} />
            <Text style={styles.heroBadgeText}>Welcome Back</Text>
          </View>
          <Text style={styles.title}>Continue your DeenQuest</Text>
          <Text style={styles.subtitle}>
            Pick up your progress, unlock your next milestone, and stay
            consistent today.
          </Text>
        </View>

        <View style={styles.formCard}>
          {displayError && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#d01818" />
              <Text style={styles.errorMessage}>{displayError}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { marginBottom: 8 }]}>
              Email Address
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="name@example.com"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) => handleChange("email", text)}
                editable={!isLoading}
              />
              <Mail
                size={20}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(text) => handleChange("password", text)}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.inputIconButton}
                onPress={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.colors.textMuted} />
                ) : (
                  <Eye size={20} color={theme.colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <TactileButton
            title={isLoading ? "Logging in..." : "Log In"}
            onPress={handleLogin}
            style={styles.loginButton}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
            <Image
              source={require("../../../assets/icons/google.png")}
              style={styles.socialIcon}
              resizeMode="contain"
            />
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.footer}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.footerText}>
            New to DeenQuest? <Text style={styles.signUpText}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -90,
    right: -50,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(136, 217, 130, 0.13)",
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -45,
    left: -90,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255, 219, 60, 0.1)",
  },
  heroRow: {
    marginBottom: theme.spacing.lg,
    gap: 10,
    alignItems: "flex-start",
    marginLeft: 5,
  },
  heroBadge: {
    marginTop: -10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: theme.colors.onSecondary,
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.textMuted,
    maxWidth: 340,
  },
  formCard: {
    backgroundColor: "rgba(31, 31, 31, 0.82)",
    borderColor: "rgba(136, 217, 130, 0.2)",
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(208, 24, 24, 0.1)",
    borderColor: "#d01818",
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorMessage: {
    color: "#ff8585",
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  forgotPassword: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: theme.colors.surfaceLow,
    borderBottomWidth: 3,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    color: theme.colors.text,
    padding: 16,
    paddingRight: 48,
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#d01818",
  },
  inputIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  inputIconButton: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 2,
  },
  errorText: {
    color: "#ff8585",
    fontSize: 12,
    marginTop: 6,
  },
  loginButton: {
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#444",
  },
  dividerText: {
    fontSize: 10,
    marginHorizontal: 12,
    color: theme.colors.outline,
  },
  socialRow: {
    flexDirection: "row",
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  socialButton: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
    minWidth: 230,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  socialText: {
    color: theme.colors.text,
    fontWeight: "700",
    marginLeft: 10,
  },
  footer: {
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textMuted,
  },
  signUpText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
