import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { getAssignedDoctorApi } from '../services/api';
import { Doctor } from '../types';

export const DoctorInfoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctor = useCallback(async () => {
    try {
      setError(null);
      const data = await getAssignedDoctorApi();
      setDoctor(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve physician details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctor();
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('Notice', 'No direct clinic phone number is registered for your physician.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email?: string) => {
    if (!email) {
      Alert.alert('Notice', 'No direct clinic email address is registered.');
      return;
    }
    Linking.openURL(`mailto:${email}?subject=AlzCare Patient Care Inquiry`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Your Physician"
        subtitle="Primary neurological care provider"
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      {error && <ErrorBanner message={error} onRetry={fetchDoctor} />}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {!doctor && !loading ? (
          <EmptyState
            icon="medkit-outline"
            title="No Assigned Physician"
            description="Your care profile has not yet been linked to a specific doctor. Please check with your clinical coordinator."
          />
        ) : (
          <>
            {/* Doctor Profile Card */}
            <Card style={styles.profileCard}>
              <View style={styles.avatarSection}>
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="doctor" size={48} color={theme.colors.primary} />
                </View>
                <Text style={styles.doctorName}>Dr. {doctor?.name || 'Assigned Physician'}</Text>
                <Text style={styles.specialization}>
                  {doctor?.specialization || 'Cognitive Neurology Specialist'}
                </Text>
                <View style={styles.badgeRow}>
                  <Badge label="Primary Physician" variant="success" size="medium" />
                  <Badge label="AlzCare Verified" variant="info" size="medium" />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="email-outline" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.detailTexts}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailValue}>{doctor?.email || 'N/A'}</Text>
                </View>
                {doctor?.email && (
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => handleEmail(doctor?.email)}
                    accessibilityLabel="Send email to doctor"
                  >
                    <MaterialCommunityIcons name="send" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {doctor?.phone && (
                <View style={styles.detailRow}>
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="phone-outline" size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.detailTexts}>
                    <Text style={styles.detailLabel}>Clinic Phone</Text>
                    <Text style={styles.detailValue}>{doctor.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => handleCall(doctor.phone)}
                    accessibilityLabel="Call clinic"
                  >
                    <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            {/* Clinical Overview Card */}
            <Card style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Physician Care Mission</Text>
              <Text style={styles.bioText}>
                Your physician monitors your cognitive health trajectory, customizes memory and motor
                training exercises, evaluates progression, and collaborates with family caregivers for holistic
                care.
              </Text>
            </Card>

            {/* Quick Action to Appointments */}
            <View style={styles.actionsContainer}>
              <Button
                title="Book Consultation"
                icon="calendar-check"
                variant="primary"
                onPress={() => navigation.navigate('AppointmentsTab')}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  profileCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    width: '100%',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  doctorName: {
    fontSize: theme.typography.sizes.h1,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  specialization: {
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  detailTexts: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textMuted,
  },
  detailValue: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
  },
  actionIconBtn: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.full,
  },
  infoCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  bioText: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  actionsContainer: {
    marginTop: theme.spacing.md,
  },
});
