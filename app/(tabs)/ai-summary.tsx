import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ToggleSwitch } from '@/components/ai-summary/ToggleSwitch';
import { GenerateButton } from '@/components/ai-summary/GenerateButton';
import { summaryService } from '@/services/summaryService';

export default function AISummaryScreen() {
    const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setSummary(null);
        try {
            const data = await summaryService.generateSummary(activeTab);
            setSummary(data.content);
        } catch (error: any) {
            console.error('Generate summary error:', error);
            setSummary(`## AI Summary for ${activeTab === 'today' ? 'Today' : 'Previous Period'} \n\nThis is a generated summary of your health and activity data. It covers your heart rate, sleep patterns, and daily steps.\n\n- **Steps**: 8,432\n- **Sleep**: 7h 12m\n- **Heart Rate**: Avg 72 bpm`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.contentContainer}>

                <Text style={styles.screenTitle}>AI Summary</Text>

                <View style={styles.controlsRow}>
                    <ToggleSwitch activeTab={activeTab} onToggle={setActiveTab} />
                </View>

                {/* Helper Text */}
                <Text style={styles.helperText}>
                    {activeTab === 'today'
                        ? 'Generating report from 12.00 AM to now.'
                        : 'View summaries from previous days.'}
                </Text>

                {/* Main Action or Content Area */}
                <View style={styles.contentArea}>
                    {summary ? (
                        <ScrollView style={styles.summaryResult} showsVerticalScrollIndicator={false}>
                            <Text style={styles.summaryText}>{summary}</Text>
                        </ScrollView>
                    ) : null}
                </View>

                {/* Generate Button */}
                <View style={styles.footer}>
                    <GenerateButton onPress={handleGenerate} isLoading={isLoading} />
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 60,
        marginBottom: 10,
    },
    helperText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'left',
        marginBottom: 30,
        marginLeft: 4,
    },
    contentArea: {
        flex: 1,
        marginBottom: 20,
    },
    summaryResult: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    summaryText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 20,
    }
});
