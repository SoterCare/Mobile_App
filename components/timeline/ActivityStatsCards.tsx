/**
 * ActivityStatsCards component for Month/Custom views
 * Matches Figma design with colored left borders and tinted backgrounds.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TimelineColors } from '../../theme/colors';
// Note: Shadows.card should be a soft shadow to match the floating look
import { Shadows } from '../../theme/shadows';
import { ActivityStats } from '../../data/mockVitals';

interface ActivityStatsCardsProps {
  stats: ActivityStats;
  title: string;
  style?: ViewStyle;
}

// Design-specific color constants to ensure exact Figma matching
const FIGMA_COLORS = {
  movement: { main: '#42dfdf', bg: '#dffcfc' },
  fall: { main: '#FF9D93', bg: '#FFF0F0' },
  urine: { main: '#91D7E4', bg: '#F0F7FF' },
};

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
        <View style={[styles.card, styles.movementCard, Shadows.card]}>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Movements{'\n'}Detected</Text>
            <View style={styles.cardBottom}>
              <View style={[styles.iconCircle, { backgroundColor: FIGMA_COLORS.movement.main }]}>
                <MaterialCommunityIcons
                  name="walk"
                  size={20}
                  color="white"
                />
              </View>
              <Text style={[styles.cardCount, { color: FIGMA_COLORS.movement.main }]}>
                {formatCount(stats.movements)}
              </Text>
            </View>
          </View>
        </View>

        {/* Falls Card */}
        <View style={[styles.card, styles.fallCard, Shadows.card]}>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Falls{'\n'}Detected</Text>
            <View style={styles.cardBottom}>
              <View style={[styles.iconCircle, { backgroundColor: FIGMA_COLORS.fall.main }]}>
                <Ionicons
                  name="warning" // Changed to match the triangle alert in Figma
                  size={18}
                  color="white"
                />
              </View>
              <Text style={[styles.cardCount, { color: FIGMA_COLORS.fall.main }]}>
                {formatCount(stats.falls)}
              </Text>
            </View>
          </View>
        </View>

        {/* Urine Card */}
        <View style={[styles.card, styles.urineCard, Shadows.card]}>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Urine{'\n'}Detected</Text>
            <View style={styles.cardBottom}>
              <View style={[styles.iconCircle, { backgroundColor: FIGMA_COLORS.urine.main }]}>
                <Ionicons
                  name="water"
                  size={18}
                  color="white"
                />
              </View>
              <Text style={[styles.cardCount, { color: FIGMA_COLORS.urine.main }]}>
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
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A4A4A', // Slightly darker to match "Monthly Activity" text
    marginBottom: 30,
    marginLeft: 4,
    marginTop: -10, // Adjusted to better align with the cards below
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 15,
    minHeight: 115,
    borderLeftWidth: 5, // The signature Figma look
    backgroundColor: '#FFFFFF',
  },
  // Specific Card Style Variants
  movementCard: {
    borderLeftColor: FIGMA_COLORS.movement.main,
    backgroundColor: FIGMA_COLORS.movement.bg,
  },
  fallCard: {
    borderLeftColor: FIGMA_COLORS.fall.main,
    backgroundColor: FIGMA_COLORS.fall.bg,
  },
  urineCard: {
    borderLeftColor: FIGMA_COLORS.urine.main,
    backgroundColor: FIGMA_COLORS.urine.bg,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    lineHeight: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Changed to center to align icon and text vertically
    marginTop: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // Slight shadow for the icon circle to make it pop
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardCount: {
    fontSize: 26, // Slightly adjusted for better fit
    fontWeight: '700',
    textAlign: 'right',
  },
});

export default ActivityStatsCards;