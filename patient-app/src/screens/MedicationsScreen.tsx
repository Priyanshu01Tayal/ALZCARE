import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ErrorBanner } from '../components/ErrorBanner';
import { getPatientProfileApi, getPatientPrescriptionsApi } from '../services/api';
import { PrescriptionItem, MedicationItem } from '../types';
import { Colors, Typography, Spacing, TouchTarget } from '../constants/theme';

export const MedicationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [doctorName, setDoctorName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Discontinued'>('All');

  const fetchMedications = useCallback(async () => {
    try {
      setError(null);
      // Fetch both dedicated prescriptions endpoint and profile data
      const [rxData, profileData] = await Promise.all([
        getPatientPrescriptionsApi().catch(() => null),
        getPatientProfileApi().catch(() => null),
      ]);

      if (profileData?.doctor?.name) {
        setDoctorName(profileData.doctor.name);
      }

      const list = rxData || profileData?.prescriptions || [];
      setPrescriptions(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load medications:', err);
      setError(err.message || 'Unable to retrieve medication schedule.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchMedications();
  };

  // Flatten medications with parent prescription metadata
  const allMeds: Array<{
    med: MedicationItem;
    rxDate: string;
    rxNotes?: string;
    prescribedBy?: string;
  }> = [];

  prescriptions.forEach((rx) => {
    const docName = (rx.doctorId as any)?.name || doctorName || 'Physician';
    (rx.medications || []).forEach((m) => {
      allMeds.push({
        med: m,
        rxDate: rx.date || rx.createdAt || new Date().toISOString(),
        rxNotes: rx.notes,
        prescribedBy: docName,
      });
    });
  });

  const filteredMeds = allMeds.filter((item) => {
    const status = item.med.status || 'Active';
    if (filter === 'All') return true;
    if (filter === 'Active') return status === 'Active';
    if (filter === 'Discontinued') return status === 'Discontinued' || status === 'Completed';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="My Medications"
        subtitle="Doctor-prescribed treatment plan"
        showBack
        onBack={() => navigation.goBack()}
      />

      {error ? <ErrorBanner message={error} onRetry={fetchMedications} /> : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Medical Advisory Box */}
        <View style={styles.advisoryBox}>
          <MaterialCommunityIcons name="shield-alert-outline" size={22} color={Colors.primaryLight} style={styles.advisoryIcon} />
          <View style={styles.advisoryTextContainer}>
            <Text style={styles.advisoryTitle}>CLINICAL PRESCRIPTION RECORD (VIEW-ONLY)</Text>
            <Text style={styles.advisoryBody}>
              These medications are officially prescribed by your physician. For your safety, do not modify dosage, schedule, or discontinue treatment without direct medical advice.
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['All', 'Active', 'Discontinued'] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilter(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab === 'All' ? `All (${allMeds.length})` : tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading prescribed medications...</Text>
          </View>
        ) : filteredMeds.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="pill" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {allMeds.length === 0 ? 'No Prescriptions on File' : `No ${filter} Medications`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {allMeds.length === 0
                ? 'Your attending physician has not recorded any medication orders yet. Prescriptions added during consultations will sync here automatically.'
                : `There are currently no medications matching the "${filter}" filter status.`}
            </Text>
          </Card>
        ) : (
          <View style={styles.listContainer}>
            {filteredMeds.map((item, idx) => {
              const med = item.med;
              const status = med.status || 'Active';
              const isDiscontinued = status === 'Discontinued';
              const isCompleted = status === 'Completed';

              return (
                <Card key={med._id || `med-${idx}`} style={[styles.medCard, isDiscontinued && styles.medCardDiscontinued]}>
                  <View style={styles.medCardHeader}>
                    <View style={styles.medTitleRow}>
                      <View style={styles.pillBadge}>
                        <MaterialCommunityIcons
                          name="pill"
                          size={18}
                          color={isDiscontinued ? Colors.textMuted : Colors.primaryLight}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.medName, isDiscontinued && styles.medNameDiscontinued]}>
                          {med.name}
                        </Text>
                        <Text style={styles.medDosage}>
                          {med.dosage} • {med.frequency}
                        </Text>
                      </View>
                    </View>
                    <Badge
                      label={status}
                      variant={isDiscontinued ? 'neutral' : isCompleted ? 'info' : 'success'}
                      size="medium"
                    />
                  </View>

                  {/* Instructions */}
                  {med.instructions ? (
                    <View style={styles.instructionBox}>
                      <MaterialCommunityIcons name="information-outline" size={16} color={Colors.primaryLight} style={{ marginRight: 6 }} />
                      <Text style={styles.instructionText}>
                        <Text style={{ fontWeight: 'bold' }}>Instructions: </Text>
                        {med.instructions}
                      </Text>
                    </View>
                  ) : null}

                  {/* Doctor & Date Footer */}
                  <View style={styles.medFooter}>
                    <View style={styles.footerRow}>
                      <MaterialCommunityIcons name="doctor" size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
                      <Text style={styles.footerText}>Prescribed by Dr. {item.prescribedBy}</Text>
                    </View>
                    <View style={styles.footerRow}>
                      <MaterialCommunityIcons name="calendar-clock" size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
                      <Text style={styles.footerText}>
                        Date: {new Date(item.rxDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {item.rxNotes ? (
                    <View style={styles.notesRow}>
                      <Text style={styles.notesLabel}>Physician Note:</Text>
                      <Text style={styles.notesContent}>{item.rxNotes}</Text>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  advisoryBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.25)',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  advisoryIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  advisoryTextContainer: {
    flex: 1,
  },
  advisoryTitle: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.primaryLight,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  advisoryBody: {
    fontSize: Typography.caption + 1,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: Typography.caption + 1,
    fontWeight: Typography.semiBold,
    color: Colors.textMuted,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.bold,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: Typography.bodySmall,
    marginTop: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.titleMedium,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContainer: {
    gap: Spacing.sm,
  },
  medCard: {
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medCardDiscontinued: {
    opacity: 0.7,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  medTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  pillBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  medName: {
    fontSize: Typography.titleSmall + 1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  medNameDiscontinued: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  medDosage: {
    fontSize: Typography.caption + 1,
    color: Colors.primaryLight,
    fontWeight: Typography.semiBold,
    marginTop: 2,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSecondary,
    padding: Spacing.sm,
    borderRadius: 10,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  instructionText: {
    flex: 1,
    fontSize: Typography.caption + 1,
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  medFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  notesRow: {
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: Spacing.xs + 2,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: Typography.caption - 1,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  notesContent: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
