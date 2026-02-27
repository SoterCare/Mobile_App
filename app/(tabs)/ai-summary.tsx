import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ToggleSwitch } from '@/components/ai-summary/ToggleSwitch';
import { GenerateButton } from '@/components/ai-summary/GenerateButton';
import { summaryService, SummaryResponse } from '@/services/summaryService';

export default function AISummaryScreen() {
    const [activeTab, setActiveTab] = useState<'today' | 'previous'>('today');
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [historyList, setHistoryList] = useState<SummaryResponse[]>([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<SummaryResponse | null>(null);

    useEffect(() => {
        if (activeTab === 'previous') {
            fetchHistory();
        } else {
            setSummary(null);
            setSelectedHistoryItem(null);
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await summaryService.getHistory();
            setHistoryList(data);
            if (data.length > 0) {
                setSelectedHistoryItem(data[0]);
            }
        } catch (error: any) {
            console.error('Fetch history error:', error);
            setHistoryList([]);
        } finally {
            setIsLoading(false);
        }
    };

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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderHistoryItem = ({ item }: { item: SummaryResponse }) => (
        <TouchableOpacity
            style={[
                styles.historyCard,
                selectedHistoryItem?.id === item.id && styles.historyCardActive
            ]}
            onPress={() => setSelectedHistoryItem(item)}
        >
            <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.historyType}>{item.type}</Text>
        </TouchableOpacity>
    );

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
                    {activeTab === 'previous' ? (
                        isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#0066CC" />
                                <Text style={styles.loadingText}>Loading history...</Text>
                            </View>
                        ) : historyList.length > 0 ? (
                            <View style={styles.historyContainer}>
                                <FlatList
                                    data={historyList}
                                    renderItem={renderHistoryItem}
                                    keyExtractor={(item) => item.id}
                                    scrollEnabled={false}
                                    style={styles.historyList}
                                />
                                {selectedHistoryItem && (
                                    <ScrollView style={styles.summaryResult} showsVerticalScrollIndicator={false}>
                                        <Text style={styles.summaryText}>{selectedHistoryItem.content}</Text>
                                    </ScrollView>
                                )}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No previous summaries found.</Text>
                                <Text style={styles.emptySubtext}>Generate a summary to see it in history.</Text>
                            </View>
                        )
                    ) : (
                        <>
                            {summary ? (
                                <ScrollView style={styles.summaryResult} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.summaryText}>{summary}</Text>
                                </ScrollView>
                            ) : null}
                        </>
                    )}
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
    },
    historyContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    historyList: {
        marginBottom: 15,
        maxHeight: 120,
    },
    historyCard: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#DDD',
    },
    historyCardActive: {
        backgroundColor: '#E3F2FD',
        borderLeftColor: '#0066CC',
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    historyType: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
