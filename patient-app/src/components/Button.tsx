import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, TouchTarget } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'normal' | 'large' | 'small';
  isLoading?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  icon?: string | React.ReactNode;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'normal',
  isLoading = false,
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
}) => {
  const showSpinner = isLoading || loading;

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'success':
        return styles.successContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      default:
        return styles.defaultText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'large':
        return styles.large;
      case 'small':
        return styles.small;
      default:
        return styles.normal;
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      const iconColor =
        variant === 'outline'
          ? Colors.textTeal
          : variant === 'secondary'
          ? Colors.textPrimary
          : '#FFFFFF';
      return (
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        </View>
      );
    }
    return <View style={styles.iconWrapper}>{icon}</View>;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || showSpinner}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || showSpinner }}
      style={[
        styles.base,
        getContainerStyle(),
        getSizeStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {showSpinner ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : '#FFF'} size="small" />
      ) : (
        <View style={styles.content}>
          {renderIcon()}
          <Text
            style={[
              styles.textBase,
              getTextStyle(),
              size === 'large' && styles.largeText,
              size === 'small' && styles.smallText,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: TouchTarget.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: Spacing.sm,
  },
  normal: {
    minHeight: TouchTarget.minHeight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  large: {
    minHeight: 56,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  small: {
    minHeight: 38,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
  },
  primaryContainer: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryContainer: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dangerContainer: {
    backgroundColor: Colors.rose,
  },
  successContainer: {
    backgroundColor: Colors.emerald,
  },
  disabledContainer: {
    backgroundColor: Colors.surfaceHighlight,
    borderColor: Colors.borderSubtle,
    shadowOpacity: 0,
    elevation: 0,
  },
  textBase: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  defaultText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: Colors.textTeal,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  largeText: {
    fontSize: Typography.titleSmall,
  },
  smallText: {
    fontSize: Typography.bodySmall,
  },
  disabledText: {
    color: Colors.textMuted,
  },
});
