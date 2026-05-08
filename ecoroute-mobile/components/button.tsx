import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'large',
  style,
  textStyle,
  disabled = false,
  icon,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getButtonStyle = () => {
    let bgColor = colors.primary;
    let textColor = '#FFFFFF';

    if (variant === 'secondary') {
      bgColor = colors.surface;
      textColor = colors.primary;
    } else if (variant === 'danger') {
      bgColor = colors.danger;
      textColor = '#FFFFFF';
    }

    return {
      backgroundColor: disabled ? colors.disabled : bgColor,
      borderColor: variant === 'secondary' ? (disabled ? colors.disabled : colors.primary) : 'transparent',
    };
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.sizeSmall;
      case 'medium':
        return styles.sizeMedium;
      case 'large':
      default:
        return styles.sizeLarge;
    }
  };

  const getTextColor = () => {
    if (variant === 'secondary') {
      return disabled ? colors.disabled : colors.primary;
    }
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.button, getSizeStyle(), getButtonStyle(), style]}
    >
      {icon}
      <ThemedText
        style={[
          styles.text,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sizeSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sizeMedium: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sizeLarge: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
