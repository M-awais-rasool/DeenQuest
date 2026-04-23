import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Sparkles,
  UserPlus,
} from "lucide-react-native";
import { ScreenWrapper } from "../../components/ScreenWrapper";
import { TactileButton } from "../../components/TactileButton";
import { AppStackParamList } from "../../navigators/navigationTypes";
import { useAppDispatch } from "../../store/hooks";
import { SignupRequest, useSignupMutation } from "../../store/services/api";
import { theme } from "../../theme/themes";
import { setError } from "../../store/slices/mainSlice";

type SignupScreenProps = NativeStackScreenProps<AppStackParamList, "Signup">;

type FormErrors = {
  email: string;
  password: string;
  confirmPassword: string;
};

const getErrorMessage = (rawError: any): string => {
  const data = rawError?.data;
  if (!data) return "Could not create account. Please try again.";

  if (typeof data.error === "string" && data.error.trim()) return data.error;

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return String(data.errors[0]);
  }

  if (data.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length > 0) return String(first[0]);
    if (typeof first === "string" && first.trim()) return first;
  }

  return "Could not create account. Please try again.";
};

export const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const dispatch = useAppDispatch();
  const [signup, { isLoading, error }] = useSignupMutation();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const passwordChecklist = useMemo(
    () => ({
      length: form.password.length >= 8,
      upper: /[A-Z]/.test(form.password),
      number: /\d/.test(form.password),
    }),
    [form.password],
  );

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setFormError(null);
    dispatch(setError(null));
  };

  const validate = () => {
    let valid = true;
    const nextErrors: FormErrors = {
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Use a valid email address";
      valid = false;
    }

    if (!form.password) {
      nextErrors.password = "Password is required";
      valid = false;
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
      valid = false;
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
      valid = false;
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    if (!acceptedTerms) {
      setFormError("Please accept the terms to continue.");
      valid = false;
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      const payload: SignupRequest = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: "USER",
      };

      await signup(payload).unwrap();
      dispatch(setError(null));
      navigation.goBack();
    } catch (err: any) {
      const message = getErrorMessage(err);
      setFormError(message);
      dispatch(setError(message));
    }
  };

  const requestError = error ? getErrorMessage(error) : null;
  const displayError = formError || requestError;

  return (
    <ScreenWrapper>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroRow}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color={theme.colors.onSecondary} />
            <Text style={styles.heroBadgeText}>New Journey</Text>
          </View>
          <Text style={styles.title}>Create your DeenQuest account</Text>
          <Text style={styles.subtitle}>
            Build daily consistency with guided milestones, reflections, and
            rewards.
          </Text>
        </View>

        <View style={styles.formCard}>
          {displayError && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={theme.colors.errorStrong} />
              <Text style={styles.errorMessage}>{displayError}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
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
                size={18}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
            </View>
            {!!errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Create a secure password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={form.password}
                onChangeText={(text) => handleChange("password", text)}
                editable={!isLoading}
              />
              <Lock
                size={18}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
            </View>
            {!!errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  errors.confirmPassword && styles.inputError,
                ]}
                placeholder="Re-enter your password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={form.confirmPassword}
                onChangeText={(text) => handleChange("confirmPassword", text)}
                editable={!isLoading}
              />
              <UserPlus
                size={18}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
            </View>
            {!!errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          <View style={styles.checklistBox}>
            <ChecklistItem
              ok={passwordChecklist.length}
              text="At least 8 characters"
            />
            <ChecklistItem
              ok={passwordChecklist.upper}
              text="Contains one uppercase letter"
            />
            <ChecklistItem
              ok={passwordChecklist.number}
              text="Contains one number"
            />
          </View>

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAcceptedTerms((prev) => !prev)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <View
              style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
            >
              {acceptedTerms && (
                <CheckCircle2 size={14} color={theme.colors.onPrimary} />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the community guidelines and privacy policy.
            </Text>
          </TouchableOpacity>

          <TactileButton
            title={isLoading ? "Creating account..." : "Create Account"}
            onPress={handleSignup}
            style={styles.signupButton}
          />
        </View>

        <TouchableOpacity
          style={styles.footer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.loginText}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

const ChecklistItem = ({ ok, text }: { ok: boolean; text: string }) => {
  return (
    <View style={styles.checklistRow}>
      <CheckCircle2
        size={14}
        color={ok ? theme.colors.primary : theme.colors.outline}
        style={styles.checklistIcon}
      />
      <Text style={[styles.checklistText, ok && styles.checklistTextActive]}>
        {text}
      </Text>
    </View>
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
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.primary14,
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -45,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.secondary11,
  },
  heroRow: {
    marginBottom: theme.spacing.lg,
    gap: 10,
    marginLeft: 5,
  },
  heroBadge: {
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
    color: theme.colors.text,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.textMuted,
    maxWidth: 340,
  },
  formCard: {
    backgroundColor: theme.colors.surface82,
    borderColor: theme.colors.primary20,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.error10,
    borderColor: theme.colors.errorStrong,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorMessage: {
    color: theme.colors.errorBright,
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: "uppercase",
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
    paddingRight: 44,
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
    fontSize: 16,
  },
  inputError: {
    borderColor: theme.colors.errorStrong,
  },
  inputIcon: {
    position: "absolute",
    right: 14,
    top: 16,
  },
  errorText: {
    color: theme.colors.errorBright,
    fontSize: 12,
    marginTop: 6,
  },
  checklistBox: {
    gap: 8,
    marginBottom: theme.spacing.md,
    padding: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface80,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checklistIcon: {
    marginRight: 8,
  },
  checklistText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  checklistTextActive: {
    color: theme.colors.text,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: theme.colors.surfaceLow,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  termsText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  signupButton: {
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textMuted,
  },
  loginText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
