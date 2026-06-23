import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import { Colors, Radius, SCREEN_PADDING } from '@/theme/tokens';
import { useSwipeTabs } from '@/hooks/useSwipeTabs';
import { nurseService } from '@/services/nurseService';
import { ChatMessage } from '@/components/nurse/chatTypes';
import { MessageBubble } from '@/components/nurse/MessageBubble';
import { TypingIndicator } from '@/components/nurse/TypingIndicator';
import { QuickReplyChips } from '@/components/nurse/QuickReplyChips';
import { WelcomeCard } from '@/components/nurse/WelcomeCard';
import { OnlineDot } from '@/components/nurse/OnlineDot';
import { Snackbar } from '@/components/nurse/Snackbar';

const CHIPS = [
    'Summarize last 6 hours',
    "How's the patient today?",
    'Any alerts recently?',
    'What medications are they on?',
    'Is everything normal?',
    'Give me a full day report',
];

/** Inline "couldn't reach Aria" row with a fade-in; tap to retry. */
function ErrorRow({ onRetry }: { onRetry: () => void }) {
    const fade = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 240, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }, [fade]);
    return (
        <Animated.View style={{ opacity: fade }}>
            <TouchableOpacity style={styles.errorRow} onPress={onRetry} activeOpacity={0.7}>
                <Ionicons name="alert-circle" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>Couldn&apos;t reach Aria. Tap to retry.</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function AINurseScreen() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [welcomeVisible, setWelcomeVisible] = useState(true);
    const [welcomeExiting, setWelcomeExiting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

    const sessionIdRef = useRef<string | undefined>(undefined);
    const scrollRef = useRef<ScrollView>(null);
    const lastScroll = useRef(0);
    const idRef = useRef(0);
    const sendScale = useRef(new Animated.Value(1)).current;

    const swipeHandlers = useSwipeTabs();

    const nextId = () => `m${(idRef.current += 1)}`;

    // Auto-scroll to bottom, throttled to once per 100ms (for the typewriter).
    const scrollToEnd = useCallback(() => {
        const now = Date.now();
        if (now - lastScroll.current < 100) return;
        lastScroll.current = now;
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }, []);

    const sendMessage = useCallback(
        async (raw: string, isRetry = false) => {
            const text = raw.trim();
            if (!text || isSending) return;

            if (welcomeVisible) setWelcomeExiting(true);
            setError(null);

            if (!isRetry) {
                setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);
            }
            setIsSending(true);

            try {
                const res = await nurseService.chat(text, sessionIdRef.current);
                sessionIdRef.current = res.sessionId || sessionIdRef.current;
                setMessages((prev) => [
                    ...prev,
                    { id: nextId(), role: 'nurse', text: res.reply || 'Sorry, I have nothing to add right now.', typewriter: true },
                ]);
            } catch {
                // Keep the last good sessionId; surface a retry row.
                setError(text);
            } finally {
                setIsSending(false);
            }
        },
        [isSending, welcomeVisible],
    );

    const handleSend = () => {
        const text = input.trim();
        if (!text || isSending) return;
        Animated.sequence([
            Animated.timing(sendScale, { toValue: 1.08, duration: 90, useNativeDriver: true }),
            Animated.spring(sendScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
        ]).start();
        setInput('');
        sendMessage(text);
    };

    const handleRetry = () => {
        if (!error) return;
        const text = error;
        setError(null);
        sendMessage(text, true);
    };

    const handleUpload = async () => {
        if (uploading || isSending) return;
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;
            const asset = result.assets?.[0];
            if (!asset) return;

            setUploading(true);
            const res = await nurseService.uploadPrescription({
                uri: asset.uri,
                name: asset.name ?? 'prescription',
                mimeType: asset.mimeType,
            });
            setSnackbar({
                visible: true,
                message: res.success
                    ? 'Prescription uploaded — Aria can now answer questions about it.'
                    : res.message || 'Upload failed. Please try again.',
            });
        } catch {
            setSnackbar({ visible: true, message: 'Upload failed. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    // Keep pinned to the newest message as the conversation grows.
    useEffect(() => {
        scrollToEnd();
    }, [messages.length, isSending, error, scrollToEnd]);

    const sendDisabled = isSending || !input.trim();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header} {...(swipeHandlers as any)}>
                <TouchableOpacity
                    onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
                    style={styles.headerBack}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.headerNameRow}>
                        <Text style={styles.headerName}>Aria</Text>
                        <OnlineDot />
                    </View>
                    <Text style={styles.headerSubtitle}>AI Nurse</Text>
                </View>
                <View style={styles.headerBack} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
            >
                {/* Message list */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.flex}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={scrollToEnd}
                >
                    {welcomeVisible && (
                        <WelcomeCard exiting={welcomeExiting} onExited={() => setWelcomeVisible(false)} />
                    )}
                    {messages.map((m) => (
                        <MessageBubble key={m.id} message={m} onReveal={scrollToEnd} />
                    ))}
                    {isSending && <TypingIndicator />}
                    {error && <ErrorRow onRetry={handleRetry} />}
                </ScrollView>

                {/* Quick replies (always visible) */}
                <QuickReplyChips chips={CHIPS} onSend={(t) => sendMessage(t)} disabled={isSending} />

                {/* Input bar */}
                <View style={styles.inputBar}>
                    <TouchableOpacity
                        style={styles.attachBtn}
                        onPress={handleUpload}
                        disabled={uploading || isSending}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons
                            name="attach"
                            size={22}
                            color={uploading ? Colors.textMuted : Colors.textSecondary}
                        />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Message Aria…"
                        placeholderTextColor={Colors.textMuted}
                        editable={!isSending}
                        multiline
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                        blurOnSubmit
                    />

                    <Animated.View style={{ transform: [{ scale: sendScale }] }}>
                        <TouchableOpacity
                            style={[styles.sendBtn, sendDisabled && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={sendDisabled}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="send" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>

            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                onHide={() => setSnackbar((s) => ({ ...s, visible: false }))}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.screenBg },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 8,
        paddingBottom: 12,
    },
    headerBack: { width: 32, alignItems: 'flex-start', justifyContent: 'center' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    headerSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
    listContent: {
        paddingHorizontal: SCREEN_PADDING,
        paddingTop: 8,
        paddingBottom: 12,
        flexGrow: 1,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-end',
        marginTop: -4,
        marginBottom: 10,
    },
    errorText: { color: Colors.danger, fontSize: 12, fontWeight: '500' },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: Colors.cardBg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    attachBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    input: {
        flex: 1,
        maxHeight: 120,
        minHeight: 38,
        backgroundColor: Colors.screenBg,
        borderRadius: Radius.lg,
        paddingHorizontal: 16,
        paddingTop: 9,
        paddingBottom: 9,
        fontSize: 15,
        color: Colors.textPrimary,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
});
