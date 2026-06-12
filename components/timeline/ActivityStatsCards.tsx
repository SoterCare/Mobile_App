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
import { Colors, Radius, circle } from '@/theme/tokens';
import { ActivityStats } from '../../data/mockVitals';

interface ActivityStatsCardsProps {
  stats: ActivityStats;
  title: string;
  style?: ViewStyle;
}

const FIGMA_COLORS = {
  movement: { main: '#42dfdf', bg: '#dffcfc' },
  fall:     { main: '#FF9D93', bg: '#FFF0F0' },
  moisture: { main: Colors.brand, bg: '#F0F7FF' },
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

        {/* Moisture Card */}
        <View style={[styles.card, styles.moistureCard, Shadows.card]}>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Moisture{'\n'}Detected</Text>
            <View style={styles.cardBottom}>
              <View style={[styles.iconCircle, { backgroundColor: FIGMA_COLORS.moisture.main }]}>
                <Ionicons name="water" size={18} color="white" />
              </View>
              <Text style={[styles.cardCount, { color: FIGMA_COLORS.moisture.main }]}>
                {formatCount(stats.moisture ?? stats.urine ?? 0)}
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
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  card: {
    flex: 1,
    borderRadius: Radius.md,
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
  moistureCard: {
    borderLeftColor: FIGMA_COLORS.moisture.main,
    backgroundColor: FIGMA_COLORS.moisture.bg,
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
    borderRadius: circle(32),
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