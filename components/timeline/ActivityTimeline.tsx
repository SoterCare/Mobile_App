/**
 * ActivityTimeline component for Day view
 * Shows a vertical timeline with activity events (movement, fall, moisture, etc.)
 * Matches the reference design with continuous vertical line on the left
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityEvent } from '../../data/mockVitals';

interface ActivityTimelineProps {
  events: ActivityEvent[];
  onFilterPress?: () => void;
  onTrashPress?: () => void;
  style?: ViewStyle;
}

const getIconConfig = (type: 'movement' | 'fall' | 'connected' | 'disconnected' | 'help_call' | 'moisture') => {
  switch (type) {
    case 'movement':
      return {
        iconName: 'walk' as const,
        iconComponent: MaterialCommunityIcons,
        backgroundColor: '#42dfdf', // Cyan
        cardBackground: '#dffcfc',
      };
    case 'fall':
      return {
        iconName: 'warning' as const,
        iconComponent: Ionicons,
        backgroundColor: '#FF9D93', // Light Red Pastel
        cardBackground: '#FFF0F0',
      };
    case 'moisture':
      return {
        iconName: 'water' as const,
        iconComponent: Ionicons,
        backgroundColor: '#91D7E4', // Light Blue
        cardBackground: '#EBF7F9', // Very light blue tint
      };
    case 'help_call':
      return {
        iconName: 'call' as const,
        iconComponent: Ionicons,
        backgroundColor: '#FFA94D',
        cardBackground: '#FFF5E6',
      };
    case 'connected':
      return {
        iconName: 'wifi' as const,
        iconComponent: Ionicons,
        backgroundColor: '#6BCB77', // Green
        cardBackground: '#EDFBEF',
      };
    case 'disconnected':
      return {
        iconName: 'wifi-outline' as const,
        iconComponent: Ionicons,
        backgroundColor: '#9A9A9A', // Grey
        cardBackground: '#F0F0F0',
      };
    default:
      return {
        iconName: 'help' as const,
        iconComponent: Ionicons,
        backgroundColor: '#999999',
        cardBackground: '#F0F0F0',
      };
  }
};

// Constants for layout - matching reference image exactly
const ICON_SIZE = 40;
const CARD_HEIGHT = 56;
const ITEM_GAP = 16;

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  onFilterPress,
  onTrashPress,
  style,
}) => {
  // Show all available mock events from the array
  const displayEvents = useMemo(() => {
    return events;
  }, [events]);

  // Calculate line height: from center of first icon to center of last icon
  const lineHeight = displayEvents.length > 1
    ? (displayEvents.length - 1) * (CARD_HEIGHT + ITEM_GAP)
    : 0;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity Timeline</Text>
        <TouchableOpacity
          onPress={onTrashPress}
          style={styles.filterButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="delete-restore" // Represents deleting history records
            size={24}
            color="#666666"
          />
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        {/* Vertical line connecting icons */}
        {displayEvents.length > 1 && (
          <View
            style={[
              styles.verticalLine,
              {
                height: lineHeight, // Draw past the last icon to mirror image
                top: CARD_HEIGHT / 2,
                left: ICON_SIZE / 2 - 2, // 2 is half of the border width of 4
              }
            ]}
          />
        )}

        {/* Empty state */}
        {displayEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No activity recorded for this day</Text>
          </View>
        )}

        {/* Timeline items */}
        {displayEvents.map((event, index) => {
          // Use type casting to handle potential 'urine' or 'moisture' naming from backend
          const config = getIconConfig(event.type as any);
          const IconComponent = config.iconComponent;
          const isLast = index === displayEvents.length - 1;

          return (
            <View
              key={event.id}
              style={[
                styles.timelineItem,
                !isLast && { marginBottom: ITEM_GAP },
              ]}
            >
              {/* Icon circle */}
              <View style={styles.iconWrapper}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: config.backgroundColor },
                  ]}
                >
                  <IconComponent
                    name={config.iconName as any}
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              {/* Event card */}
              <View style={styles.cardWrapper}>
                <View
                  style={[
                    styles.eventCardContainer,
                    { backgroundColor: config.backgroundColor },
                  ]}
                >
                  <View
                    style={[
                      styles.eventCardInner,
                      { backgroundColor: config.cardBackground },
                    ]}
                  >
                    <Text style={styles.eventLabel}>{event.label}</Text>
                    <Text style={styles.eventTime}>{event.time}</Text>
                  </View>
                </View>

                {/* Device info below card */}
                {event.deviceInfo && event.deviceInfo.length > 0 && (
                  <View style={styles.deviceInfoContainer}>
                    {event.deviceInfo.map((info: string, i: number) => (
                      <Text key={i} style={styles.deviceInfoText}>
                        {info}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A4A4A',
    marginTop: 10,
  },
  filterButton: {
    padding: 4,
    marginTop: 10,
  },
  timeline: {
    position: 'relative',
    marginTop: 8,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#BBBBBB',
    fontWeight: '500',
  },
  verticalLine: {
    position: 'absolute',
    width: 4,
    backgroundColor: '#CCCCCC',
    zIndex: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    flex: 1,
    marginLeft: 16,
  },
  eventCardContainer: {
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  eventCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: CARD_HEIGHT,
    paddingHorizontal: 16,
    marginLeft: 6, 
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  eventTime: {
    fontSize: 12,
    color: '#666666',
  },
  deviceInfoContainer: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  deviceInfoText: {
    fontSize: 10,
    color: '#999999',
    marginBottom: 4,
    fontWeight: '500',
  },
});

export default ActivityTimeline;