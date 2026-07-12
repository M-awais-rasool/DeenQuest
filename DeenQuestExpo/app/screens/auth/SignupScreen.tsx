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
import { SignupRequest, useSignupMutation } from "../../store/services/api";
import { useAppDispatch } from "../../store/hooks";
import { AppStackParamList } from "../../navigators/navigationTypes";
import { setError } from "../../store/slices/mainSlice";
import { theme } from "../../theme/themes";

type SignupScreenProps = NativeStackScreenProps<AppStackParamList, "Signup">;
type SignupField = "name" | "email" | "password";

function getErrorMessage(err: any): string {
  const validationErrors = err?.data?.errors as string[] | undefined;
  return (
    err?.data?.error ||
    validationErrors?.[0] ||
    "Signup failed. Please try again."
  );
}

/** ✓ / ○ requirement row under the password field (A4 mock). */
function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.reqRow}>
      <View style={[styles.reqDot, met ? styles.reqDotMet : styles.reqDotIdle]}>
        {met && <Text style={styles.reqDotText}>✓</Text>}
      </View>
      <Text style={[styles.reqLabel, met && styles.reqLabelMet]}>{label}</Text>
    </View>
  );
}

export const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const dispatch = useAppDispatch();
  const [signup, { isLoading }] = useSignupMutation();
  const scrollRef = useRef<ScrollView>(null);
  const formOffset = useRef(0);
  const inputOffsets = useRef<Record<SignupField, number>>({
    name: 0,
    email: 0,
    password: 0,
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const hasMinLength = form.password.length >= 8;
  const hasNumber = /\d/.test(form.password);

  const handleChange = (field: SignupField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setFormError(null);
    dispatch(setError(null));
  };

  const handleInputFocus = (field: SignupField) => {
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
    const next = { name: "", email: "", password: "" };

    if (!form.name.trim()) {
      next.name = "Name is required";
      valid = false;
    }
    if (!form.email.trim()) {
      next.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      next.email = "Invalid email format";
      valid = false;
    }
    if (!form.password) {
      next.password = "Password is required";
      valid = false;
    } else if (!hasMinLength || !hasNumber) {
      next.password = "Password doesn't meet the requirements below";
      valid = false;
    }

    setErrors(next);
    return valid;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      const payload: SignupRequest = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: "USER",
        display_name: form.name.trim(),
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Free forever. Your journey starts today.
            </Text>
          </View>

          <View
            style={styles.form}
            onLayout={(event) => {
              formOffset.current = event.nativeEvent.layout.y;
            }}
          >
            <View
              onLayout={(event) => {
                inputOffsets.current.name = event.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>NAME</Text>
              <TextInput
                style={[styles.input, !!errors.name && styles.inputError]}
                placeholder="Your name"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                selectionColor={theme.colors.primary}
                value={form.name}
                onChangeText={(text) => handleChange("name", text)}
                onFocus={() => handleInputFocus("name")}
                editable={!isLoading}
              />
              {!!errors.name && (
                <View style={styles.errorRow}>
                  <View style={styles.errorDot}>
                    <Text style={styles.errorDotText}>!</Text>
                  </View>
                  <Text style={styles.errorText}>{errors.name}</Text>
                </View>
              )}
            </View>

            <View
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
              {!!(errors.email || formError) && (
                <View style={styles.errorRow}>
                  <View style={styles.errorDot}>
                    <Text style={styles.errorDotText}>!</Text>
                  </View>
                  <Text style={styles.errorText}>
                    {errors.email || formError}
                  </Text>
                </View>
              )}
            </View>

            <View
              onLayout={(event) => {
                inputOffsets.current.password = event.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    form.password.length > 0 && styles.inputActive,
                    !!errors.password && styles.inputError,
                  ]}
                  placeholder="Create a password"
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
                  onPress={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={19} color="#5F7E7C" />
                  ) : (
                    <Eye size={19} color="#5F7E7C" />
                  )}
                </AnimatedPressable>
              </View>
              <View style={styles.reqList}>
                <Requirement met={hasMinLength} label="At least 8 characters" />
                <Requirement met={hasNumber} label="Contains a number" />
              </View>
              {!!errors.password && (
                <View style={styles.errorRow}>
                  <View style={styles.errorDot}>
                    <Text style={styles.errorDotText}>!</Text>
                  </View>
                  <Text style={styles.errorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            <TactileButton
              title={isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              onPress={handleSignup}
              size="lg"
              style={styles.submitButton}
            />
          </View>

          <AnimatedPressable
            style={styles.footer}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.loginText}>Log in</Text>
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
    borderRadius: 16,
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
  },
  inputActive: {
    borderColor: theme.colors.primary,
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
  reqList: {
    gap: 6,
    marginTop: 10,
    marginLeft: 4,
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reqDot: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  reqDotMet: {
    backgroundColor: theme.colors.primaryContainer,
  },
  reqDotIdle: {
    borderWidth: 2,
    borderColor: "#2C464C",
  },
  reqDotText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontFamily: "Nunito_900Black",
  },
  reqLabel: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: "#5F7E7C",
  },
  reqLabelMet: {
    color: theme.colors.textMuted,
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
  submitButton: {
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
  loginText: {
    color: theme.colors.primary,
    fontFamily: "Nunito_900Black",
  },
});

export default SignupScreen;
