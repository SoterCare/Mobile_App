import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TimelineColors } from '@/theme/colors';

interface GenerateButtonProps {
    onPress: () => void;
    isLoading: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ onPress, isLoading }) => {
    return (
        <TouchableOpacity
            style={[styles.generateButton, isLoading && styles.disabledButton]}
            activeOpacity={0.8}
            onPress={onPress}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator color={TimelineColors.textWhite} />
            ) : (
                <Text style={styles.generateButtonText}>Generate Summary</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    generateButton: {
        backgroundColor: TimelineColors.primaryCyan,
        borderRadius: 25,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: TimelineColors.primaryCyan,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.7,
    },
    generateButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: TimelineColors.textWhite,
    },
});
