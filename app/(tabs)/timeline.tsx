import { View, Text, StyleSheet, Dimensions, Image, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NeumorphicButton } from '@/components/ui/NeumorphicButton';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TimelineScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header (Mimic DeviceStatusHeader style) */}
                <View style={styles.headerCard}>
                    <Text style={styles.title}>Timeline Report</Text>
                    <NeumorphicButton
                        label="Create Report"
                        onPress={() => router.push('/export-report')}
                        style={styles.reportContainer}
                        contentStyle={styles.reportButtonContent}
                        textStyle={{ fontSize: 13, fontWeight: '600', color: '#333' }}
                        icon={<IconSymbol name="paperplane.fill" size={16} color="#333" />}
                        variant="primary"
                    />
                </View>

                {/* Content Placeholder */}
                <View style={styles.content}>
                    <Text style={styles.placeholder}>Chart Visualization Placeholder</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f3f7', // Neumorphic Base
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        opacity: 0.15,
    },
    backgroundImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    // Consistent Header Style
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    reportContainer: {
        // Layout positioning if needed
    },
    reportButtonContent: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#E0F7FA', // Slight tint
        alignItems: 'center',
        flexDirection: 'row',
    },
    content: {
        flex: 1,
        minHeight: 400,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
    },
    placeholder: {
        fontSize: 16,
        color: '#999',
    },
});
