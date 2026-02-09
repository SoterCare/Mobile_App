/**
 * Reusable SegmentedControl component
 * Supports two variants:
 * - "pillButtons": Separate pill buttons with individual shadows
 * - "capsuleTabs": Single capsule container with inner active pill
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { TimelineColors } from '../../theme/colors';
import { Shadows } from '../../theme/shadows';

export interface SegmentOption {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: 'pillButtons' | 'capsuleTabs';
  style?: ViewStyle;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  activeKey,
  onChange,
  variant = 'pillButtons',
  style,
}) => {
  if (variant === 'capsuleTabs') {
    return (
      <View style={[styles.capsuleContainer, Shadows.card, style]}>
        {options.map((option) => {
          const isActive = option.key === activeKey;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.capsuleTab,
                isActive && styles.capsuleTabActive,
              ]}
              onPress={() => onChange(option.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.capsuleTabText,
                  isActive && styles.capsuleTabTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // pillButtons variant
  return (
    <View style={[styles.pillButtonsContainer, style]}>
      {options.map((option) => {
        const isActive = option.key === activeKey;
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.pillButton,
              Shadows.button,
              isActive && styles.pillButtonActive,
            ]}
            onPress={() => onChange(option.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pillButtonText,
                isActive && styles.pillButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Pill Buttons variant styles
  pillButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  } as ViewStyle,

  pillButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: TimelineColors.cardBackground,
  } as ViewStyle,

  pillButtonActive: {
    backgroundColor: TimelineColors.primaryCyan,
  } as ViewStyle,

  pillButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: TimelineColors.textMedium,
  } as TextStyle,

  pillButtonTextActive: {
    color: TimelineColors.textWhite,
    fontWeight: '600',
  } as TextStyle,

  // Capsule Tabs variant styles
  capsuleContainer: {
    flexDirection: 'row',
    backgroundColor: TimelineColors.cardBackground,
    borderRadius: 999,
    padding: 4,
  } as ViewStyle,

  capsuleTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  capsuleTabActive: {
    backgroundColor: TimelineColors.primaryCyan,
  } as ViewStyle,

  capsuleTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: TimelineColors.textMedium,
  } as TextStyle,

  capsuleTabTextActive: {
    color: TimelineColors.textWhite,
    fontWeight: '600',
  } as TextStyle,
});

export default SegmentedControl;
