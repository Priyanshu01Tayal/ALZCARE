import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { getNotificationsApi, markNotificationReadApi } from '../services/api';
import { NotificationItem } from '../types';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const data = await getNotificationsApi();
      setNotifications(data || []);
    } catch (err: any) {
      // Backend may return 404 or empty if no notifications yet
      setError(null);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, read: true } : item))
      );
    } catch (err) {
      console.log('Error marking notification read:', err);
    }
  };

  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('game') || t.includes('exercise')) {
      return { icon: 'gamepad-variant-outline', color: theme.colors.primary };
    }
    if (t.includes('appointment') || t.includes('doctor')) {
      return { icon: 'calendar-clock', color: theme.colors.accent };
    }
    if (t.includes('alert') || t.includes('warning')) {
      return { icon: 'alert-circle-outline', color: theme.colors.warning };
    }
    return { icon: 'bell-outline', color: theme.colors.primary };
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Notifications"
        subtitle="Care reminders & clinical updates"
        showBack={true}
        onBack={() => navigation.goBack()}
      />

      {error && <ErrorBanner message={error} onRetry={fetchNotifications} />}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="All Caught Up!"
            description="You have no unread notifications or reminders from your care team right now."
          />
        ) : (
          notifications.map((item) => {
            const iconConfig = getNotificationIcon(item.title || item.message || '');
            const timeAgo = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <TouchableOpacity
                key={item._id}
                onPress={() => !item.read && handleMarkRead(item._id)}
                activeOpacity={0.8}
              >
                <Card
                  style={StyleSheet.flatten([
                    styles.notificationCard,
                    !item.read && styles.unreadCard,
                  ])}
                >
                  <View style={styles.cardRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: `${iconConfig.color}20` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={iconConfig.icon as any}
                        size={24}
                        color={iconConfig.color}
                      />
                    </View>

                    <View style={styles.contentColumn}>
                      <View style={styles.titleRow}>
                        <Text style={styles.titleText}>{item.title}</Text>
                        {!item.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.messageText}>{item.message}</Text>
                      <Text style={styles.timestamp}>{timeAgo}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
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
  notificationCard: {
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unreadCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceLight,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleText: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  messageText: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});
