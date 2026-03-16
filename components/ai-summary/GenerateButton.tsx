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
        backgroundColor: '#91D7E4',
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    disabledButton: {
        opacity: 0.7,
    },
    generateButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
