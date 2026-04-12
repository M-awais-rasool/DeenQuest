import { theme } from '@/theme/themes';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface TactileButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: any;
  textStyle?: any;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isPrimary ? styles.primaryText : styles.secondaryText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderBottomColor: theme.colors.primaryContainer,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surfaceHigh,
    borderBottomColor: theme.colors.surfaceLow,
  },
  text: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryText: {
    color: theme.colors.onPrimary,
  },
  secondaryText: {
    color: theme.colors.secondary,
  },
});
