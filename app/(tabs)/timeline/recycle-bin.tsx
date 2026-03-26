import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { recycleBinService } from '@/services/recycleBinService';

// Types updated to match AlertCard
interface RemovedActivity {
  id: string;
  deviceId?: string;
  type: 'movement' | 'fall' | 'urine' | 'sos' | 'help_call';
  title: string;
  time: string;
}

// Helper to map backend items to RemovedActivity
const mapToRemovedActivity = (item: any): RemovedActivity => ({
  id: String(item.id ?? item._id ?? item.eventId),
  deviceId: item.deviceId ?? item.device_id,
  type: item.type ?? item.category ?? 'movement',
  title: item.title ?? item.label ?? item.name ?? 'Activity',
  time: item.time ?? item.createdAt ?? item.timestamp ?? '',
});

/**
 * Updated configuration to match AlertCard colors and icons
 * iconBgColor: Matches the circle background in Recent Alerts
 * cardBgColor: A softer, tinted version for the Recycle Bin card
 */
const getActivityConfig = (type: RemovedActivity['type']) => {
  switch (type) {
    case 'movement':
      return {
        iconName: 'walk' as const,
        iconBgColor: '#42dfdf',
        cardBgColor: '#E0FBFB',
        buttonBgColor: '#42dfdf',
      };
    case 'fall':
      return {
        iconName: 'warning' as const,
        iconBgColor: '#FF9D93',
        cardBgColor: '#FFF2F1',
        buttonBgColor: '#FF9D93',
      };
    case 'urine':
      return {
        iconName: 'water' as const,
        iconBgColor: '#91D7E4',
        cardBgColor: '#F0F9FB',
        buttonBgColor: '#91D7E4',
      };
    case 'sos':
      return {
        iconName: 'alert-circle' as const,
        iconBgColor: '#FF6B6B',
        cardBgColor: '#FFF0F0',
        buttonBgColor: '#FF6B6B',
      };
    case 'help_call':
      return {
        iconName: 'call' as const,
        iconBgColor: '#FFA94D',
        cardBgColor: '#FFF5EB',
        buttonBgColor: '#FFA94D',
      };
    default:
      return {
        iconName: 'help' as const,
        iconBgColor: '#999999',
        cardBgColor: '#F5F5F5',
        buttonBgColor: '#999999',
      };
  }
};

const ICON_SIZE = 36;
const CARD_MIN_HEIGHT = 72;
const ITEM_GAP = 16;

export default function RecycleBinScreen() {
  const router = useRouter();
  const [removedActivities, setRemovedActivities] = useState<RemovedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDismissed = useCallback(async () => {
    try {
      setError(null);
      const data = await recycleBinService.getDismissed();
      const mapped = (data || []).map(mapToRemovedActivity);
      setRemovedActivities(mapped);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dismissed activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDismissed();
  }, [fetchDismissed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDismissed();
  }, [fetchDismissed]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRestore = useCallback((activity: RemovedActivity) => {
    Alert.alert(
      'Restore Activity',
      `Are you sure you want to restore "${activity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await recycleBinService.restore({ id: activity.id });
              setRemovedActivities((prev) =>
                prev.filter((item) => item.id !== activity.id)
              );
              Alert.alert('Restored', `"${activity.title}" has been restored.`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to restore activity');
            }
          },
        },
      ]
    );
  }, []);

  const lineHeight =
    removedActivities.length > 1
      ? (removedActivities.length - 1) * (CARD_MIN_HEIGHT + ITEM_GAP) +
        CARD_MIN_HEIGHT / 2
      : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleGoBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#333333" />
        </Pressable>
        <Text style={styles.headerTitle}>Recycle Bin</Text>
      </View>

      <Text style={styles.description}>
        Restore the detections that were previously marked as false positives.
      </Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#42dfdf" />
          </View>
        )}

        {!loading && error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{error}</Text>
            <Pressable onPress={fetchDismissed} style={{ marginTop: 12 }}>
              <Text style={{ color: '#42dfdf', fontWeight: '600' }}>Retry</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && (
          <>
            <View style={styles.topRow}>
              <Text style={styles.removedLabel}>Removed Activities</Text>
              <Text style={styles.dateLabel}>
                {removedActivities.length > 0 && removedActivities[0].time
                  ? new Date(removedActivities[0].time).toLocaleDateString('en-CA')
                  : new Date().toLocaleDateString('en-CA')}
              </Text>
            </View>

            {removedActivities.length > 0 ? (
              <View style={styles.timeline}>
                {removedActivities.length > 1 && (
                  <View
                    style={[
                      styles.verticalLine,
                      {
                        height: lineHeight,
                        top: ICON_SIZE / 2,
                        left: ICON_SIZE / 2 - 1,
                      },
                    ]}
                  />
                )}

                {removedActivities.map((activity, index) => {
                  const config = getActivityConfig(activity.type);
                  const isLast = index === removedActivities.length - 1;

                  return (
                    <View
                      key={activity.id}
                      style={[
                        styles.timelineItem,
                        !isLast && { marginBottom: ITEM_GAP },
                      ]}
                    >
                      <View style={styles.iconWrapper}>
                        <View
                          style={[
                            styles.iconCircle,
                            { backgroundColor: config.iconBgColor },
                          ]}
                        >
                          <Ionicons
                            name={config.iconName as any}
                            size={18}
                            color="#FFFFFF"
                          />
                        </View>
                      </View>

                      <View
                        style={[
                          styles.activityCard,
                          { backgroundColor: config.cardBgColor },
                        ]}
                      >
                        <View style={styles.cardContent}>
                          <Text style={styles.activityTitle}>{activity.title}</Text>
                          <Text style={styles.activityTime}>{activity.time}</Text>
                        </View>
                        <Pressable
                          style={({ pressed }) => [
                            styles.restoreButton,
                            { backgroundColor: config.buttonBgColor },
                            pressed && styles.restoreButtonPressed,
                          ]}
                          onPress={() => handleRestore(activity)}
                        >
                          <Text style={styles.restoreButtonText}>Restore</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trash-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>No removed activities</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginTop: 10,
  },
  backButton: {
    padding: 4,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginLeft: -4,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    paddingHorizontal: 30,
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  removedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  dateLabel: {
    fontSize: 14,
    color: '#999999',
  },
  timeline: {
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#E0E0E0',
    zIndex: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginTop: 8,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    flex: 1,
    marginLeft: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: CARD_MIN_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666666',
  },
  restoreButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  restoreButtonPressed: {
    opacity: 0.8,
  },
  restoreButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999999',
  },
});