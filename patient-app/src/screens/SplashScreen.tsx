import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing } from '../constants/theme';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation?: SplashScreenNavigationProp;
}

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { user, token, isLoading } = useAuth();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (navigation) {
          if (token && user) {
            navigation.replace('Main');
          } else {
            navigation.replace('Login');
          }
        }
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [isLoading, token, user, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoCircle, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.logoIcon}>🧠</Text>
      </Animated.View>

      <Text style={styles.appName}>AlzCare</Text>
      <Text style={styles.tagline}>Cognitive Care & Rehabilitation Portal</Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure Clinical Patient Portal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.cardSecondary,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 54,
  },
  appName: {
    fontSize: Typography.titleHero + 4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: Typography.bodyLarge,
    color: Colors.primaryLight,
    marginTop: Spacing.xs,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: Spacing.xxl,
  },
  footerText: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});
