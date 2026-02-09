/**
 * ActivityStatsCards component for Month/Custom views
 * Shows 3 stat cards: Movements, Falls, Urine detected counts
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TimelineColors } from '../../theme/colors';
import { Shadows } from '../../theme/shadows';
import { ActivityStats } from '../../data/mockVitals';

interface ActivityStatsCardsProps {
  stats: ActivityStats;
  title: string;
  style?: ViewStyle;
}

const ActivityStatsCards: React.FC<ActivityStatsCardsProps> = ({
  stats,
  title,
  style,
}) => {
  const formatCount = (count: number): string => {
    return count.toString().padStart(2, '0');
  };

  return (
    <View style={[styles.container, style]}>
      {/* Section Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Stats Cards Row */}
      <View style={styles.cardsRow}>
        {/* Movements Card */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Movements{'\n'}Detected</Text>
            <View style={styles.cardBottom}>
              <View style={[styles.iconCircle, styles.movementIcon]}>
                <MaterialCommunityIcons
                  name="walk"
                  size={20}
                  color={TimelineColors.textWhite}
                />
              </View>
              <Text style={[styles.cardCount, styles.movementCount]}>
                {formatCount(stats.movements)}
              </Text>
            </View>
          </View>
        </View>

        {/* Falls Card */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Falls{'\n'}Detected</Text>
            <View style={styles.cardBottom}>
              <View style={[styles.iconCircle, styles.fallIcon]}>
                <Ionicons
                  name="alert"
                  size={18}
                  color={TimelineColors.textWhite}
                />
              </View>
              <Text style={[styles.cardCount, styles.fallCount]}>
                {formatCount(stats.falls)}
              </Text>
            </View>
          </View>
        </View>

        {/* Urine Card */}
        <View style={[styles.card, Shadows.card]}>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Urine{'\n'}Detected</Text>
            <View style={styles.cardBottom}>
              <View style={[styles.iconCircle, styles.urineIcon]}>
                <Ionicons
                  name="water"
                  size={18}
                  color={TimelineColors.textWhite}
                />
              </View>
              <Text style={[styles.cardCount, styles.urineCount]}>
                {formatCount(stats.urine)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: TimelineColors.textDark,
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: TimelineColors.cardBackground,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 110,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: TimelineColors.textMedium,
    lineHeight: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movementIcon: {
    backgroundColor: TimelineColors.movementTeal,
  },
  fallIcon: {
    backgroundColor: TimelineColors.fallRed,
  },
  urineIcon: {
    backgroundColor: TimelineColors.urineBlue,
  },
  cardCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  movementCount: {
    color: TimelineColors.movementTeal,
  },
  fallCount: {
    color: TimelineColors.fallRed,
  },
  urineCount: {
    color: TimelineColors.urineBlue,
  },
});

export default ActivityStatsCards;
