import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Mail, Lock, AlertCircle } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { TactileButton } from '../../components/TactileButton';
import { LoginRequest, useLoginMutation } from '../../store/services/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setAccessToken,
  setError,
  setIsAuthenticated,
  setUser,
} from '../../store/slices/mainSlice';
import { theme } from '../../theme/themes';

export const LoginScreen = () => {
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const { error: reduxError } = useAppSelector(state => state.main);

  const [form, setForm] = useState<LoginRequest>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    dispatch(setError(null));
  };

  const validate = () => {
    let valid = true;
    let newErrors = { email: '', password: '' };

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (form.password.length < 6) {
      newErrors.password = 'Minimum 6 characters required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const result = await login(form).unwrap();

      // Save user data and token to Redux
      if (result.data) {
        dispatch(setUser(result.data.user));
        dispatch(setAccessToken(result.data.access_token));
        dispatch(setIsAuthenticated(true));
        dispatch(setError(null));
      }
    } catch (err: any) {
      const errorMessage =
        err?.data?.error || 'Login failed. Please try again.';
      dispatch(setError(errorMessage));
    }
  };

  const displayError = reduxError || (error as any)?.data?.error;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image source={require('../../../assets/icons/new-logo.png')} />
          <Text style={styles.title}>DeenQuest</Text>
          <Text style={styles.subtitle}>Continue your sacred journey</Text>
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
                onChangeText={text => handleChange('email', text)}
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
                secureTextEntry
                value={form.password}
                onChangeText={text => handleChange('password', text)}
                editable={!isLoading}
              />
              <Lock
                size={20}
                color={theme.colors.textMuted}
                style={styles.inputIcon}
              />
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <TactileButton
            title={isLoading ? 'Logging in...' : 'Log In'}
            onPress={handleLogin}
            style={styles.loginButton}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <Image
                source={require('../../../assets/icons/google.png')}
                style={styles.socialIcon}
                resizeMode="contain"
              />
              <Text style={styles.socialText}>Google</Text>
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
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: 'rgba(31, 31, 31, 0.6)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(208, 24, 24, 0.1)',
    borderColor: '#d01818',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorMessage: {
    color: '#d01818',
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textMuted,
  },
  forgotPassword: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  inputWrapper: {
    position: 'relative',
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
    borderColor: '#d01818',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  errorText: {
    color: '#d01818',
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    marginTop: theme.spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#444',
  },
  dividerText: {
    fontSize: 10,
    marginHorizontal: 12,
    color: theme.colors.outline,
  },
  socialRow: {
    flexDirection: 'row',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceHigh,
    padding: 12,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textMuted,
  },
  signUpText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
