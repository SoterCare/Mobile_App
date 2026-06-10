import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, SCREEN_PADDING, Spacing } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default) or a plain View. */
  scroll?: boolean;
  edges?: readonly Edge[];
  /** Extra style merged onto the padded content container. */
  contentStyle?: ViewStyle;
}

/**
 * Standard screen scaffold: canonical background + consistent content padding.
 * Cards inside fill the padded width — no width:'1xx%' or negative margins.
 */
export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  contentStyle,
}) => {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.container} edges={edges}>
      <StatusBar style="dark" />
      {body}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.screenBg },
  flex: { flex: 1 },
  content: { padding: SCREEN_PADDING, paddingBottom: Spacing.xxxl },
});
