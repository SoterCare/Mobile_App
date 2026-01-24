import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ToggleSwitchProps {
    activeTab: 'today' | 'previous';
    onToggle: (tab: 'today' | 'previous') => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ activeTab, onToggle }) => {
    return (
        <View style={styles.toggleContainer}>
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
        borderRadius: 25,
        padding: 4,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignSelf: 'flex-start',
        minWidth: 200,
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    activeToggleButton: {
        backgroundColor: '#8FD9E5',
        shadowColor: '#8FD9E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    activeToggleText: {
        color: '#FFFFFF',
    },
});
