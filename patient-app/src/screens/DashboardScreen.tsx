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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Appointment, GameAssignment } from '../types';
import { useAuth } from '../context/AuthContext';
import { getPatientProfileApi, getGameProgressApi, getNotificationsApi, syncPendingGameResultsApi } from '../services/api';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [assignedGames, setAssignedGames] = useState<GameAssignment[]>([]);
  const [progressSummary, setProgressSummary] = useState<any>(null);
  const [recentScores, setRecentScores] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [profileData, progressData, notifs] = await Promise.all([
        getPatientProfileApi().catch(() => null),
        getGameProgressApi().catch(() => null),
        getNotificationsApi().catch(() => []),
      ]);

      if (profileData) {
        setDoctorInfo(profileData.doctor || null);

        // Find upcoming appointment (Scheduled and date >= today)
        const appointments: Appointment[] = profileData.appointments || [];
        const upcoming = appointments
          .filter((a) => a.status === 'Scheduled')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        setUpcomingAppointment(upcoming || null);

        // Active assigned games
        const games: GameAssignment[] = profileData.games || [];
        const activeAssigned = games.filter((g) => g.status === 'Assigned');
        setAssignedGames(activeAssigned);
      }

      if (progressData) {
        setProgressSummary(progressData.summary || null);
        setRecentScores(progressData.recentResults || []);
      }

      if (Array.isArray(notifs)) {
        setUnreadNotifications(notifs.filter((n: any) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncPendingGameResultsApi().then(() => {
        fetchDashboardData();
      });
    }, [fetchDashboardData])
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading care dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
        {/* Welcome Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.patientName}>{user?.name || 'Patient'}</Text>
            <Text style={styles.patientIdBadge}>{user?.patientId || 'PAT-0001'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {unreadNotifications > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Assigned Game Alert Banner */}
        {assignedGames.length > 0 ? (
          <Card variant="highlight" style={styles.assignedCard}>
            <View style={styles.assignedHeader}>
              <View style={styles.assignedBadgeRow}>
                <Ionicons name="sparkles" size={18} color={Colors.amberLight} />
                <Text style={styles.assignedBadgeText}>NEW REHABILITATION TASK</Text>
              </View>
              <Badge label="Assigned" type="assigned" />
            </View>

            <Text style={styles.assignedGameTitle}>{assignedGames[0].gameName}</Text>
            <Text style={styles.assignedDetails}>
              Prescribed by Dr. {doctorInfo?.name || 'Your Doctor'} •{' '}
              {assignedGames[0].difficulty || 'Medium'} difficulty
            </Text>

            <Button
              title="Play Assigned Game Now"
              onPress={() =>
                navigation.navigate('GamePlay', {
                  gameName: assignedGames[0].gameName,
                  difficulty: assignedGames[0].difficulty,
                  assignmentId: assignedGames[0]._id,
                })
              }
              variant="primary"
              size="large"
              style={styles.playNowBtn}
            />
          </Card>
        ) : (
          <Card style={styles.noAssignedCard}>
            <View style={styles.noAssignedRow}>
              <View style={styles.relaxIconCircle}>
                <Ionicons name="checkmark-circle-outline" size={28} color={Colors.emerald} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.noAssignedTitle}>All Daily Exercises Up to Date!</Text>
                <Text style={styles.noAssignedSub}>
                  Great job keeping your mind active. Practice games any time below.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Quick Access Navigation Grid */}
        <Text style={styles.sectionTitle}>QUICK CARE ACCESS</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Main', { screen: 'Games' } as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(13, 148, 136, 0.2)' }]}>
              <Ionicons name="game-controller-outline" size={26} color={Colors.textTeal} />
            </View>
            <Text style={styles.quickTitle}>Exercises</Text>
            <Text style={styles.quickSubtitle}>Brain Games</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Main', { screen: 'Appointments' } as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Ionicons name="calendar-outline" size={26} color={Colors.blue} />
            </View>
            <Text style={styles.quickTitle}>Visits</Text>
            <Text style={styles.quickSubtitle}>Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Main', { screen: 'Progress' } as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="trending-up-outline" size={26} color={Colors.emerald} />
            </View>
            <Text style={styles.quickTitle}>Progress</Text>
            <Text style={styles.quickSubtitle}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('DoctorInfo')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Ionicons name="medkit-outline" size={26} color={Colors.amber} />
            </View>
            <Text style={styles.quickTitle}>Doctor</Text>
            <Text style={styles.quickSubtitle}>Clinical Care</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointment Section */}
        <Text style={styles.sectionTitle}>UPCOMING APPOINTMENT</Text>
        {upcomingAppointment ? (
          <Card style={styles.appointmentCard}>
            <View style={styles.apptTopRow}>
              <View style={styles.doctorAvatar}>
                <Ionicons name="person" size={24} color={Colors.primaryLight} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.apptDoctorName}>
                  {typeof upcomingAppointment.doctorId === 'object'
                    ? (upcomingAppointment.doctorId as any)?.name
                    : doctorInfo?.name || 'Dr. Specialist'}
                </Text>
                <Text style={styles.apptSpecialty}>
                  {doctorInfo?.specialization || 'Neurology & Cognitive Health'}
                </Text>
              </View>
              <Badge label={upcomingAppointment.status} type="scheduled" />
            </View>

            <View style={styles.apptDivider} />

            <View style={styles.apptMetaRow}>
              <View style={styles.apptMetaItem}>
                <Ionicons name="calendar" size={16} color={Colors.textTeal} />
                <Text style={styles.apptMetaText}>
                  {new Date(upcomingAppointment.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.apptMetaItem}>
                <Ionicons name="time" size={16} color={Colors.textTeal} />
                <Text style={styles.apptMetaText}>{upcomingAppointment.timeSlot}</Text>
              </View>
            </View>

            {upcomingAppointment.reason ? (
              <Text style={styles.apptReason}>Purpose: {upcomingAppointment.reason}</Text>
            ) : null}
          </Card>
        ) : (
          <Card style={styles.noApptCard}>
            <Ionicons name="calendar-outline" size={28} color={Colors.textMuted} />
            <Text style={styles.noApptTitle}>No Upcoming Appointments</Text>
            <Text style={styles.noApptSub}>
              Book a consultation or cognitive checkup with Dr. {doctorInfo?.name || 'your physician'}.
            </Text>
            <Button
              title="Book Checkup"
              onPress={() => navigation.navigate('Main', { screen: 'Appointments' } as any)}
              variant="outline"
              size="small"
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        )}

        {/* Your Cognitive Progress Summary */}
        <Text style={styles.sectionTitle}>YOUR COGNITIVE PROGRESS</Text>
        <Card style={styles.progressCard}>
          <View style={styles.progressGrid}>
            <View style={styles.progressCol}>
              <Text style={styles.progLabel}>COMPLETED</Text>
              <Text style={styles.progValue}>
                {progressSummary?.completedAssignments || 0}
              </Text>
              <Text style={styles.progSub}>exercises done</Text>
            </View>
            <View style={styles.progDivider} />
            <View style={styles.progressCol}>
              <Text style={styles.progLabel}>AVG SCORE</Text>
              <Text style={[styles.progValue, { color: Colors.emeraldLight }]}>
                {progressSummary?.averageScore || 0}
              </Text>
              <Text style={styles.progSub}>points</Text>
            </View>
            <View style={styles.progDivider} />
            <View style={styles.progressCol}>
              <Text style={styles.progLabel}>BEST SCORE</Text>
              <Text style={[styles.progValue, { color: Colors.amberLight }]}>
                {progressSummary?.bestScore || 0}
              </Text>
              <Text style={styles.progSub}>highest</Text>
            </View>
          </View>

          <Button
            title="View Full Progress Report"
            onPress={() => navigation.navigate('Main', { screen: 'Progress' } as any)}
            variant="secondary"
            size="small"
            style={{ marginTop: Spacing.md }}
          />
        </Card>

        {/* Prescribed Medications */}
        <Text style={styles.sectionTitle}>PRESCRIBED MEDICATIONS</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Medications')}
          style={{ marginBottom: Spacing.lg }}
        >
          <Card style={styles.medBannerCard}>
            <View style={styles.medBannerRow}>
              <View style={styles.medBannerIcon}>
                <Ionicons name="medkit" size={22} color={Colors.primaryLight} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.medBannerTitle}>Treatment &amp; Prescriptions</Text>
                <Text style={styles.medBannerSubtitle}>
                  View medications prescribed by Dr. {doctorInfo?.name || 'your physician'}, dosage instructions, and active treatment schedules.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Recent Game Activity */}
        {recentScores.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>RECENT EXERCISE SESSIONS</Text>
            <View style={styles.recentList}>
              {recentScores.slice(0, 3).map((item, idx) => (
                <View key={item._id || idx} style={styles.recentItem}>
                  <View style={styles.recentIcon}>
                    <Text style={{ fontSize: 20 }}>🧠</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={styles.recentGameName}>{item.gameName}</Text>
                    <Text style={styles.recentDate}>
                      {new Date(item.completionDate || item.createdAt).toLocaleDateString()} •{' '}
                      {item.timeTaken || 0}s duration
                    </Text>
                  </View>
                  <View style={styles.recentScoreBadge}>
                    <Text style={styles.recentScoreText}>{item.score}</Text>
                    <Text style={styles.recentAccText}>{item.accuracy}% acc</Text>
                  </View>
                </View>
              ))}
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
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.bodyLarge,
    marginTop: Spacing.md,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  greetingText: {
    fontSize: Typography.bodyLarge,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  patientName: {
    fontSize: Typography.titleLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  patientIdBadge: {
    fontSize: Typography.caption,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.textTeal,
    marginTop: 2,
    fontWeight: Typography.bold,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.rose,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: Typography.bold,
  },
  assignedCard: {
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  assignedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  assignedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assignedBadgeText: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.amberLight,
    letterSpacing: 0.6,
  },
  assignedGameTitle: {
    fontSize: Typography.titleSmall + 2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  assignedDetails: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  playNowBtn: {
    marginTop: Spacing.xs,
  },
  noAssignedCard: {
    marginBottom: Spacing.lg,
  },
  noAssignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relaxIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.emeraldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAssignedTitle: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  noAssignedSub: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    width: '47.5%',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickTitle: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  quickSubtitle: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  appointmentCard: {
    marginBottom: Spacing.lg,
  },
  apptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptDoctorName: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  apptSpecialty: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  apptDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  apptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  apptMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  apptMetaText: {
    fontSize: Typography.bodyRegular,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  apptReason: {
    fontSize: Typography.caption + 1,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  noApptCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  noApptTitle: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  noApptSub: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  progressCard: {
    marginBottom: Spacing.lg,
  },
  progressGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  progressCol: {
    flex: 1,
    alignItems: 'center',
  },
  progLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
  },
  progValue: {
    fontSize: Typography.titleLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginVertical: 2,
  },
  progSub: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  progDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  recentList: {
    gap: Spacing.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentGameName: {
    fontSize: Typography.bodyRegular,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  recentDate: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  recentScoreBadge: {
    alignItems: 'flex-end',
  },
  recentScoreText: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    color: Colors.amberLight,
  },
  recentAccText: {
    fontSize: Typography.caption,
    color: Colors.emerald,
  },
  medBannerCard: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 148, 136, 0.3)',
    borderRadius: 18,
    padding: Spacing.md,
  },
  medBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medBannerTitle: {
    fontSize: Typography.titleSmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  medBannerSubtitle: {
    fontSize: Typography.caption + 1,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
