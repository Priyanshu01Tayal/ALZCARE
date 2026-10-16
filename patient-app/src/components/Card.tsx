import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'highlight' | 'accent' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'highlight':
        return styles.highlight;
      case 'accent':
        return styles.accent;
      case 'outlined':
        return styles.outlined;
      default:
        return styles.default;
    }
  };

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  default: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
  },
  highlight: {
    backgroundColor: '#0F2327', // Subtle Teal tint
    borderColor: Colors.primaryGlow,
  },
  accent: {
    backgroundColor: '#1E1B2E', // Subtle Indigo tint
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
});
