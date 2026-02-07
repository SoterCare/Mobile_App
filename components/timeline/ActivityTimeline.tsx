/**
 * ActivityTimeline component for Day view
 * Shows a vertical timeline with activity events (movement, fall only)
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
  style?: ViewStyle;
}

const getIconConfig = (type: ActivityEvent['type']) => {
  switch (type) {
    case 'movement':
      return {
        iconName: 'walk' as const,
        iconComponent: MaterialCommunityIcons,
        backgroundColor: '#4ECDC4',
        cardBackground: '#D4F5F5',
      };
    case 'fall':
      return {
        iconName: 'alert' as const,
        iconComponent: Ionicons,
        backgroundColor: '#F5A9A9',
        cardBackground: '#FFEEEE',
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
const ICON_SIZE = 36;
const CARD_HEIGHT = 48;
const ITEM_GAP = 12;

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  onFilterPress,
  style,
}) => {
  // Filter to show only movement and fall events, limit to 2  
  const displayEvents = useMemo(() => {
    const filteredEvents = events.filter(
      (event) => event.type === 'movement' || event.type === 'fall'
    );
    return filteredEvents.slice(0, 2);
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
          onPress={onFilterPress}
          style={styles.filterButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color="#CCCCCC"
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
                height: lineHeight,
                top: CARD_HEIGHT / 2,
                left: ICON_SIZE / 2 - 1,
              }
            ]}
          />
        )}

        {/* Timeline items */}
        {displayEvents.map((event, index) => {
          const config = getIconConfig(event.type);
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
                    styles.eventCard,
                    { backgroundColor: config.cardBackground },
                  ]}
                >
                  <Text style={styles.eventLabel}>{event.label}</Text>
                  <Text style={styles.eventTime}>{event.time}</Text>
                </View>

                {/* Device info below Fall card */}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  filterButton: {
    padding: 4,
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
    marginLeft: 10,
  },
  eventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: CARD_HEIGHT,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  eventLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
  },
  eventTime: {
    fontSize: 12,
    color: '#999999',
  },
  deviceInfoContainer: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  deviceInfoText: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 2,
    fontWeight: '400',
  },
});

export default ActivityTimeline;
