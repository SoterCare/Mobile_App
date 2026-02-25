import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TimelineColors } from '@/theme/colors';
import { Shadows } from '@/theme/shadows';

interface ToggleSwitchProps {
    activeTab: 'today' | 'previous';
    onToggle: (tab: 'today' | 'previous') => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ activeTab, onToggle }) => {
    return (
        <View style={[styles.toggleContainer, Shadows.card]}>
            <TouchableOpacity
                style={[
                    styles.toggleButton,
                    activeTab === 'today' && styles.activeToggleButton
                ]}
                onPress={() => onToggle('today')}
                activeOpacity={0.8}
            >
                <Text style={[
                    styles.toggleText,
                    activeTab === 'today' && styles.activeToggleText
                ]}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.toggleButton,
                    activeTab === 'previous' && styles.activeToggleButton
                ]}
                onPress={() => onToggle('previous')}
                activeOpacity={0.8}
            >
                <Text style={[
                    styles.toggleText,
                    activeTab === 'previous' && styles.activeToggleText
                ]}>Previous</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: TimelineColors.cardBackground,
        borderRadius: 25,
        padding: 4,
        alignSelf: 'flex-start',
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeToggleButton: {
        backgroundColor: TimelineColors.primaryCyan,
    },
    toggleText: {
        fontSize: 15,
        fontWeight: '600',
        color: TimelineColors.textMedium,
    },
    activeToggleText: {
        color: TimelineColors.textWhite,
    },
});
