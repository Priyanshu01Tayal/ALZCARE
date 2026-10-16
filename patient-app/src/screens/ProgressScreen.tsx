import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getGameProgressApi } from '../services/api';
import { GameProgressSummary } from '../types';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';

export const ProgressScreen: React.FC = () => {
  const [data, setData] = useState<GameProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await getGameProgressApi();
      setData(res);
    } catch (error) {
      console.error('Failed to load progress summary:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProgress();
    }, [fetchProgress])
  );

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchProgress();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading progress analytics...</Text>
      </View>
    );
  }

  const summary = data?.summary || {
    totalAssignments: 0,
    completedAssignments: 0,
    totalPlayed: 0,
    bestScore: 0,
    averageScore: 0,
    averageAccuracy: 0,
    averageTime: 0,
    completionRate: 0,
  };

  const gameWise = data?.gameWise || [];
  const recentResults = data?.recentResults || [];

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
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cognitive Progress</Text>
          <Text style={styles.headerSubtitle}>
            Track your cognitive performance milestones, accuracy progression, and exercise history.
          </Text>
        </View>

        {/* 4 Overview Metric Cards */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <View style={styles.kpiIconWrapper}>
              <Ionicons name="checkbox-outline" size={24} color={Colors.primaryLight} />
            </View>
            <Text style={styles.kpiValue}>{summary.completedAssignments}</Text>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
            <Text style={styles.kpiSub}>exercises</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={styles.kpiIconWrapper}>
              <Ionicons name="repeat-outline" size={24} color={Colors.blue} />
            </View>
            <Text style={styles.kpiValue}>{summary.totalPlayed}</Text>
            <Text style={styles.kpiLabel}>ATTEMPTS</Text>
            <Text style={styles.kpiSub}>sessions logged</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={styles.kpiIconWrapper}>
              <Ionicons name="speedometer-outline" size={24} color={Colors.emerald} />
            </View>
            <Text style={[styles.kpiValue, { color: Colors.emerald }]}>
              {summary.averageScore}
            </Text>
            <Text style={styles.kpiLabel}>AVG SCORE</Text>
            <Text style={styles.kpiSub}>{summary.averageAccuracy}% accuracy</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={styles.kpiIconWrapper}>
              <Ionicons name="trophy-outline" size={24} color={Colors.amber} />
            </View>
            <Text style={[styles.kpiValue, { color: Colors.amberLight }]}>
              {summary.bestScore}
            </Text>
            <Text style={styles.kpiLabel}>BEST SCORE</Text>
            <Text style={styles.kpiSub}>all exercises</Text>
          </Card>
        </View>

        {/* Overall Completion Rate Card */}
        <Card variant="highlight" style={styles.rateCard}>
          <View style={styles.rateHeader}>
            <Text style={styles.rateTitle}>Doctor Assignment Completion</Text>
            <Text style={styles.ratePercent}>{summary.completionRate}%</Text>
          </View>
          <ProgressBar progress={summary.completionRate} showPercent={false} color={Colors.primary} />
          <Text style={styles.rateDescription}>
            {summary.completedAssignments} of {summary.totalAssignments} assigned exercises have been completed.
          </Text>
        </Card>

        {/* Game-Wise Progress Breakdown */}
        <Text style={styles.sectionTitle}>GAME-WISE PROGRESSION</Text>
        <View style={styles.gameWiseList}>
          {gameWise.map((gw, idx) => (
            <Card key={idx} style={styles.gameWiseCard}>
              <View style={styles.gwTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gwTitle}>{gw.gameName}</Text>
                  <Text style={styles.gwCategory}>{gw.category}</Text>
                </View>
                <View style={styles.gwBadge}>
                  <Text style={styles.gwBadgeText}>
                    {gw.attempts > 0 ? `${gw.attempts} Attempts` : 'Not Played'}
                  </Text>
                </View>
              </View>

              <View style={styles.gwMetricsRow}>
                <View style={styles.gwMetricItem}>
                  <Text style={styles.gwMetricLabel}>BEST SCORE</Text>
                  <Text style={[styles.gwMetricVal, { color: Colors.amberLight }]}>
                    {gw.bestScore > 0 ? gw.bestScore : '--'}
                  </Text>
                </View>

                <View style={styles.gwMetricDivider} />

                <View style={styles.gwMetricItem}>
                  <Text style={styles.gwMetricLabel}>AVERAGE</Text>
                  <Text style={[styles.gwMetricVal, { color: Colors.emeraldLight }]}>
                    {gw.averageScore > 0 ? gw.averageScore : '--'}
                  </Text>
                </View>

                <View style={styles.gwMetricDivider} />

                <View style={styles.gwMetricItem}>
                  <Text style={styles.gwMetricLabel}>COMPLETED</Text>
                  <Text style={styles.gwMetricVal}>{gw.completedCount} times</Text>
                </View>
              </View>

              {gw.lastPlayed && (
                <Text style={styles.gwLastPlayed}>
                  Last played on {new Date(gw.lastPlayed).toLocaleDateString()}
                </Text>
              )}
            </Card>
          ))}
        </View>

        {/* Recent Session Activity Logs */}
        <Text style={styles.sectionTitle}>EXERCISE ACTIVITY HISTORY</Text>
        {recentResults.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="analytics-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No exercise results recorded yet.</Text>
            <Text style={styles.emptySub}>
              Play your first memory match or reflex game to start tracking your cognitive progress.
            </Text>
          </Card>
        ) : (
          <View style={styles.historyList}>
            {recentResults.map((result, idx) => (
              <View key={result._id || idx} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyIcon}>🎯</Text>
                  <View style={{ marginLeft: Spacing.sm }}>
                    <Text style={styles.historyGame}>{result.gameName}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(result.completionDate || (result as any).createdAt).toLocaleDateString()} •{' '}
                      {result.timeTaken || 0}s duration
                    </Text>
                  </View>
                </View>

                <View style={styles.historyRight}>
                  <Text style={styles.historyScore}>{result.score}</Text>
                  <Text style={styles.historyAccuracy}>{result.accuracy}% acc</Text>
                </View>
              </View>
            ))}
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
  header: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.titleLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    width: '47.5%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  kpiIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  kpiValue: {
    fontSize: Typography.titleLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  kpiLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  rateCard: {
    marginBottom: Spacing.xl,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  rateTitle: {
    fontSize: Typography.bodyRegular,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  ratePercent: {
    fontSize: Typography.titleSmall,
    fontWeight: Typography.bold,
    color: Colors.textTeal,
  },
  rateDescription: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  gameWiseList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  gameWiseCard: {
    padding: Spacing.md,
  },
  gwTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  gwTitle: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  gwCategory: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gwBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: Colors.cardSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gwBadgeText: {
    fontSize: Typography.caption,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  gwMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.cardSecondary,
    borderRadius: 12,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  gwMetricItem: {
    alignItems: 'center',
  },
  gwMetricLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
  },
  gwMetricVal: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  gwMetricDivider: {
    width: 1,
    height: 25,
    backgroundColor: Colors.border,
  },
  gwLastPlayed: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  historyList: {
    gap: Spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    fontSize: 22,
  },
  historyGame: {
    fontSize: Typography.bodyRegular,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  historyDate: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyScore: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    color: Colors.amberLight,
  },
  historyAccuracy: {
    fontSize: Typography.caption,
    color: Colors.emerald,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
