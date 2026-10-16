import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface BadgeProps {
  label: string;
  type?: 'assigned' | 'completed' | 'easy' | 'medium' | 'hard' | 'scheduled' | 'cancelled' | 'info';
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'assigned' | 'completed' | 'easy' | 'medium' | 'hard' | 'scheduled' | 'cancelled' | string;
  size?: 'small' | 'medium' | 'large' | string;
}

export const Badge: React.FC<BadgeProps> = ({ label, type, variant, size = 'small' }) => {
  const chosen = variant || type || 'info';

  const getBadgeStyle = () => {
    switch (chosen) {
      case 'assigned':
      case 'warning':
        return {
          bg: Colors.amberGlow,
          border: 'rgba(245, 158, 11, 0.4)',
          text: Colors.amberLight,
        };
      case 'completed':
      case 'success':
        return {
          bg: Colors.emeraldGlow,
          border: 'rgba(16, 185, 129, 0.4)',
          text: Colors.emeraldLight,
        };
      case 'easy':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: Colors.emerald,
        };
      case 'medium':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.3)',
          text: Colors.amber,
        };
      case 'hard':
      case 'danger':
      case 'cancelled':
        return {
          bg: 'rgba(244, 63, 94, 0.15)',
          border: 'rgba(244, 63, 94, 0.3)',
          text: Colors.rose,
        };
      case 'scheduled':
      case 'primary':
        return {
          bg: Colors.primaryGlow,
          border: 'rgba(13, 148, 136, 0.4)',
          text: Colors.textTeal,
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          border: 'rgba(148, 163, 184, 0.3)',
          text: Colors.textSecondary,
        };
    }
  };

  const current = getBadgeStyle();
  const isMed = size === 'medium';

  return (
    <View
      style={[
        styles.container,
        isMed && styles.mediumContainer,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
        },
      ]}
    >
      <Text style={[styles.text, isMed && styles.mediumText, { color: current.text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  mediumContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 10,
  },
  text: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mediumText: {
    fontSize: 12,
  },
});
