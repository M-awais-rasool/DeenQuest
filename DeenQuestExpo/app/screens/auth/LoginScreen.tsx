import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { AnimatedPressable } from "../../components/ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Eye, EyeOff, ChevronLeft } from "lucide-react-native";
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
type LoginField = keyof LoginRequest;

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const scrollRef = useRef<ScrollView>(null);
  const formOffset = useRef(0);
  const inputOffsets = useRef<Record<LoginField, number>>({
    email: 0,
    password: 0,
  });
  const { error: reduxError } = useAppSelector(
    (state: RootState) => (state as RootState & { main: MainState }).main,
  );

  const [form, setForm] = useState<LoginRequest>({
    email: "awais@gmail.com",
    password: "Helo@1234",
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

  const handleInputFocus = (field: LoginField) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(
          formOffset.current +
            inputOffsets.current[field] -
            (Platform.OS === "android" ? 190 : theme.spacing.lg),
          0,
        ),
        animated: true,
      });
    }, 180);
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
    <ScreenWrapper innerStyle={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          keyboardShouldPersistTaps="handled"
        >
          {navigation.canGoBack() && (
            <AnimatedPressable
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft
                size={18}
                color={theme.colors.text}
                strokeWidth={2.5}
              />
            </AnimatedPressable>
          )}

          <View style={styles.heroRow}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Your streak missed you. Log in to continue.
            </Text>
          </View>

          <View
            style={styles.form}
            onLayout={(event) => {
              formOffset.current = event.nativeEvent.layout.y;
            }}
          >
            <View
              style={styles.inputGroup}
              onLayout={(event) => {
                inputOffsets.current.email = event.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={[styles.input, !!errors.email && styles.inputError]}
                placeholder="name@example.com"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={theme.colors.primary}
                value={form.email}
                onChangeText={(text) => handleChange("email", text)}
                onFocus={() => handleInputFocus("email")}
                editable={!isLoading}
              />
              {!!errors.email && (
                <View style={styles.errorRow}>
                  <View style={styles.errorDot}>
                    <Text style={styles.errorDotText}>!</Text>
                  </View>
                  <Text style={styles.errorText}>{errors.email}</Text>
                </View>
              )}
            </View>

            <View
              style={styles.inputGroup}
              onLayout={(event) => {
                inputOffsets.current.password = event.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    (!!errors.password || !!displayError) && styles.inputError,
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  selectionColor={theme.colors.primary}
                  value={form.password}
                  onChangeText={(text) => handleChange("password", text)}
                  onFocus={() => handleInputFocus("password")}
                  editable={!isLoading}
                />
                <AnimatedPressable
                  style={styles.inputIconButton}
                  onPress={() => {
                    setShowPassword((prev) => !prev);
                  }}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={19} color="#5F7E7C" />
                  ) : (
                    <Eye size={19} color="#5F7E7C" />
                  )}
                </AnimatedPressable>
              </View>
              {(!!errors.password || !!displayError) && (
                <View style={styles.errorRow}>
                  <View style={styles.errorDot}>
                    <Text style={styles.errorDotText}>!</Text>
                  </View>
                  <Text style={styles.errorText}>
                    {errors.password || displayError}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.forgotPassword}>Forgot password?</Text>

            <TactileButton
              title={isLoading ? "Logging in..." : "Log In"}
              onPress={handleLogin}
              size="lg"
              style={styles.loginButton}
            />
          </View>

          <AnimatedPressable
            style={styles.footer}
            onPress={() => navigation.navigate("Signup")}
          >
            <Text style={styles.footerText}>
              New to DeenQuest?{" "}
              <Text style={styles.signUpText}>Create account</Text>
            </Text>
          </AnimatedPressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 14,
    paddingBottom: theme.spacing.xxl,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  heroRow: {
    marginTop: 26,
    marginBottom: 26,
    gap: 6,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontFamily: "Nunito_900Black",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
  },
  form: {
    gap: 16,
  },
  inputGroup: {},
  label: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 7,
    marginLeft: 4,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    color: theme.colors.text,
    paddingVertical: 15,
    paddingHorizontal: 18,
    paddingRight: 48,
    borderRadius: 16,
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputIconButton: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 2,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 9,
    marginLeft: 4,
  },
  errorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3A1E24",
    alignItems: "center",
    justifyContent: "center",
  },
  errorDotText: {
    color: theme.colors.error,
    fontSize: 10,
    fontFamily: "Nunito_900Black",
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    flex: 1,
  },
  forgotPassword: {
    fontSize: 13,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.primary,
    textAlign: "right",
  },
  loginButton: {
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
    paddingTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontFamily: "Nunito_700Bold",
  },
  signUpText: {
    color: theme.colors.primary,
    fontFamily: "Nunito_900Black",
  },
});
