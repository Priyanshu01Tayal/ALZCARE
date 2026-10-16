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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, PatientGameItem } from '../types';
import { getPatientGamesApi } from '../services/api';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';

export const GamesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [games, setGames] = useState<PatientGameItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'assigned'>('all');

  const fetchGames = useCallback(async () => {
    try {
      const data = await getPatientGamesApi();
      setGames(data.games || []);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGames();
    }, [fetchGames])
  );

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchGames();
  };

  const filteredGames = games.filter((g) => {
    if (activeFilter === 'assigned') return g.isAssigned;
    return true;
  });

  const getGameIcon = (iconName?: string) => {
    switch (iconName) {
      case 'search':
        return 'search';
      case 'zap':
        return 'flash';
      case 'layers':
        return 'layers';
      default:
        return 'fitness';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching cognitive exercises...</Text>
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
        {/* Title Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cognitive Exercises</Text>
          <Text style={styles.headerSubtitle}>
            Prescribed brain exercises and daily memory training tasks from your doctor.
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All Exercises ({games.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'assigned' && styles.filterPillActive]}
            onPress={() => setActiveFilter('assigned')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'assigned' && styles.filterPillTextActive,
              ]}
            >
              Doctor Assigned ({games.filter((g) => g.isAssigned).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Games List */}
        {filteredGames.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Exercises Found</Text>
            <Text style={styles.emptySub}>
              {activeFilter === 'assigned'
                ? 'No games are currently pending assignment. You can still practice all games from the "All Exercises" tab.'
                : 'No games available at the moment.'}
            </Text>
          </Card>
        ) : (
          <View style={styles.gamesList}>
            {filteredGames.map((game) => {
              const diffType = game.assignedDifficulty?.toLowerCase() as any;

              return (
                <Card
                  key={game.id}
                  variant={game.isAssigned ? 'highlight' : 'default'}
                  style={styles.gameCard}
                >
                  {/* Card Header */}
                  <View style={styles.gameHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons
                        name={getGameIcon(game.icon) as any}
                        size={24}
                        color={Colors.primaryLight}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.sm + 4 }}>
                      <Text style={styles.gameName}>{game.gameName}</Text>
                      <Text style={styles.gameCategory}>{game.category}</Text>
                    </View>
                    <View style={styles.badgeCol}>
                      {game.isAssigned && (
                        <Badge label="Assigned" type="assigned" />
                      )}
                      <Badge
                        label={game.assignedDifficulty || game.difficulty}
                        type={diffType || 'medium'}
                      />
                    </View>
                  </View>

                  <Text style={styles.gameDescription}>{game.description}</Text>

                  {/* Performance Metrics */}
                  <View style={styles.metricsBox}>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Best Score</Text>
                      <Text style={[styles.metricVal, { color: Colors.amberLight }]}>
                        {game.bestScore > 0 ? game.bestScore : '--'}
                      </Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Last Score</Text>
                      <Text style={styles.metricVal}>
                        {game.lastScore > 0 ? game.lastScore : '--'}
                      </Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Attempts</Text>
                      <Text style={styles.metricVal}>{game.attempts}</Text>
                    </View>
                  </View>

                  {/* Progress Bar based on completion attempts */}
                  <View style={styles.progressSection}>
                    <ProgressBar
                      progress={Math.min(game.attempts * 20, 100)}
                      label="Training Progress"
                    />
                  </View>

                  {/* Play Action Button */}
                  <Button
                    title="Play Exercise"
                    onPress={() =>
                      navigation.navigate('GamePlay', {
                        gameName: game.gameName,
                        difficulty: game.assignedDifficulty || game.difficulty,
                        assignmentId: game.assignmentId || undefined,
                      })
                    }
                    variant={game.isAssigned ? 'primary' : 'secondary'}
                    size="large"
                    icon={<Ionicons name="play" size={18} color="#FFF" />}
                    style={styles.playBtn}
                  />
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
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterPill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  filterPillTextActive: {
    color: Colors.textTeal,
    fontWeight: Typography.bold,
  },
  gamesList: {
    gap: Spacing.lg,
  },
  gameCard: {
    padding: Spacing.lg,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameName: {
    fontSize: Typography.titleSmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  gameCategory: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  gameDescription: {
    fontSize: Typography.bodyRegular,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginVertical: Spacing.sm,
  },
  metricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.cardSecondary,
    borderRadius: 14,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
  metricVal: {
    fontSize: Typography.titleSmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  progressSection: {
    marginVertical: Spacing.xs,
  },
  playBtn: {
    marginTop: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.titleSmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
