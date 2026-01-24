import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export const SummaryHeader = () => {
    return (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Summary</Text>
            <Image
                source={require('@/assets/images/SoterCare-Primary-logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    logo: {
        width: 80,
        height: 40,
    },
});
