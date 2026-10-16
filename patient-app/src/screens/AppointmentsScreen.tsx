import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { useFocusEffect } from '@react-navigation/native';
import { getAppointmentsApi, bookAppointmentApi, updateAppointmentStatusApi } from '../services/api';
import { Appointment } from '../types';

export const AppointmentsScreen: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab filter: upcoming vs past
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Booking Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      setError(null);
      const data = await getAppointmentsApi();
      setAppointments(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments. Please check connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const now = new Date();
  const upcomingAppointments = appointments.filter((app) => {
    const appDate = new Date(app.date);
    const isPendingOrConfirmed = app.status === 'Scheduled' || app.status === 'Confirmed' || app.status === 'Pending';
    return isPendingOrConfirmed && appDate >= new Date(now.setHours(0, 0, 0, 0));
  });

  const pastAppointments = appointments.filter((app) => {
    const appDate = new Date(app.date);
    return app.status === 'Completed' || app.status === 'Cancelled' || appDate < new Date(now.setHours(0, 0, 0, 0));
  });

  const handleBookAppointment = async () => {
    if (!bookingDate.trim()) {
      Alert.alert('Required Information', 'Please select or enter an appointment date (e.g. 2026-10-05).');
      return;
    }
    if (!bookingReason.trim()) {
      Alert.alert('Required Information', 'Please provide a brief reason for your consultation.');
      return;
    }

    try {
      setBookingLoading(true);
      await bookAppointmentApi({
        date: bookingDate.trim(),
        timeSlot: bookingTime.trim(),
        reason: bookingReason.trim(),
      });
      Alert.alert('Success', 'Your appointment request has been scheduled with your physician.');
      setModalVisible(false);
      setBookingDate('');
      setBookingReason('');
      fetchAppointments();
    } catch (err: any) {
      Alert.alert('Booking Notice', err.message || 'Unable to schedule appointment at this time.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = (id: string) => {
    Alert.alert(
      'Cancel Appointment?',
      'Are you sure you want to cancel this scheduled consultation? Your physician will be notified immediately.',
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateAppointmentStatusApi(id, 'Cancelled');
              Alert.alert('Notice', 'The appointment has been marked as cancelled.');
              fetchAppointments();
            } catch (err: any) {
              Alert.alert('Notice', err.message || 'Unable to cancel appointment.');
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Scheduled':
        return <Badge label={status} variant="success" size="medium" />;
      case 'Completed':
        return <Badge label="Completed" variant="info" size="medium" />;
      case 'Cancelled':
        return <Badge label="Cancelled" variant="danger" size="medium" />;
      default:
        return <Badge label={status || 'Pending'} variant="warning" size="medium" />;
    }
  };

  const displayedList = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Appointments"
        subtitle="Manage care check-ins and consultations"
        rightAction={
          <TouchableOpacity
            style={styles.bookHeaderBtn}
            onPress={() => setModalVisible(true)}
            accessibilityLabel="Book new appointment"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="calendar-plus" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchAppointments} />}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
          onPress={() => setActiveTab('upcoming')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'upcoming' }}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({upcomingAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'past' && styles.tabButtonActive]}
          onPress={() => setActiveTab('past')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'past' }}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past ({pastAppointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {displayedList.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
            description={
              activeTab === 'upcoming'
                ? 'You do not have any appointments scheduled right now. Tap below to schedule a check-in with your doctor.'
                : 'Your consultation history will be safely archived here.'
            }
            actionLabel={activeTab === 'upcoming' ? 'Request Appointment' : undefined}
            onAction={activeTab === 'upcoming' ? () => setModalVisible(true) : undefined}
          />
        ) : (
          displayedList.map((app) => {
            const formattedDate = new Date(app.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <Card key={app._id} style={styles.appointmentCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.dateBlock}>
                    <MaterialCommunityIcons name="calendar-month" size={24} color={theme.colors.primary} />
                    <View style={styles.dateTexts}>
                      <Text style={styles.dateTitle}>{formattedDate}</Text>
                      <Text style={styles.timeTitle}>
                        {app.timeSlot || 'Scheduled Time'}
                      </Text>
                    </View>
                  </View>
                  {getStatusBadge(app.status)}
                </View>

                <View style={styles.divider} />

                {app.doctorId && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="doctor" size={20} color={theme.colors.textSecondary} />
                    <Text style={styles.infoText}>
                      Physician: {typeof app.doctorId === 'object' ? (app.doctorId as any).name || 'Assigned Physician' : 'Assigned Physician'}
                    </Text>
                  </View>
                )}

                {app.reason && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={theme.colors.textSecondary} />
                    <Text style={styles.infoText}>Consultation Note: {app.reason}</Text>
                  </View>
                )}

                {(app.status === 'Scheduled' || app.status === 'Confirmed' || app.status === 'Pending') && (
                  <View style={styles.cancelBtnRow}>
                    <TouchableOpacity
                      style={styles.cancelActionBtn}
                      onPress={() => handleCancelAppointment(app._id)}
                      accessibilityLabel="Cancel appointment"
                      accessibilityRole="button"
                    >
                      <MaterialCommunityIcons name="calendar-remove" size={16} color={theme.colors.danger} />
                      <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            );
          })
        )}

        <View style={styles.actionSection}>
          <Button
            title="Book An Appointment"
            icon="calendar-plus"
            variant="primary"
            onPress={() => setModalVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Appointment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={26} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Schedule a clinical follow-up or cognitive consultation with your assigned physician.
            </Text>

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={bookingDate}
              onChangeText={setBookingDate}
              placeholder="e.g. 2026-10-15"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.inputLabel}>Time Slot</Text>
            <View style={styles.timeSlotRow}>
              {['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM'].map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeChip, bookingTime === slot && styles.timeChipActive]}
                  onPress={() => setBookingTime(slot)}
                >
                  <Text style={[styles.timeChipText, bookingTime === slot && styles.timeChipTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Reason / Clinical Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bookingReason}
              onChangeText={setBookingReason}
              placeholder="e.g. Routine cognitive follow-up & medication review"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              />
              <Button
                title="Submit Request"
                variant="primary"
                loading={bookingLoading}
                style={styles.modalConfirmBtn}
                onPress={handleBookAppointment}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bookHeaderBtn: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  appointmentCard: {
    marginBottom: theme.spacing.md,
  },
  cancelBtnRow: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    gap: 6,
  },
  cancelBtnText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.danger,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dateTexts: {
    gap: 2,
  },
  dateTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  timeTitle: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
  },
  actionSection: {
    marginTop: theme.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textSecondary,
    marginVertical: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceLight,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.sizes.body,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeSlotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  timeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeChipText: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textSecondary,
  },
  timeChipTextActive: {
    color: '#000',
    fontWeight: theme.typography.weights.bold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  modalCancelBtn: {
    flex: 1,
  },
  modalConfirmBtn: {
    flex: 1.5,
  },
});
