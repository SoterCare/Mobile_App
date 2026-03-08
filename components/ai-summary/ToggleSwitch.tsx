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
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 4,
        width: '100%',
        ...Shadows.card,
        elevation: 4, // explicit elevation for android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeToggleButton: {
        backgroundColor: '#8FD9E5', // the cyan color mapped exactly
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    activeToggleText: {
        color: '#FFFFFF',
    },
});
