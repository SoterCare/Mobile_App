import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PatientAvatar, AvatarActivity, AVATAR_ACTIVITIES } from '@/components/PatientAvatar';

const LABELS: Record<AvatarActivity, string> = {
  walking: 'Walking',
  standingUp: 'Standing Up',
  standingDown: 'Sitting Down',
  idle: 'Idle',
};

export default function AvatarDemoScreen() {
  const [activity, setActivity] = useState<AvatarActivity>('walking');
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={styles.title}>Patient Avatar</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.subtitle}>Activity: {LABELS[activity]}</Text>

      <View style={styles.stage}>
        <PatientAvatar activity={activity} />
      </View>

      <View style={styles.controls}>
        {AVATAR_ACTIVITIES.map((a) => {
          const active = activity === a;
          return (
            <TouchableOpacity
              key={a}
              style={[styles.btn, active && styles.btnActive]}
              onPress={() => setActivity(a)}
            >
              <Text style={[styles.btnText, active && styles.btnTextActive]}>{LABELS[a]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f3f7', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#4A4A4A' },
  subtitle: { textAlign: 'center', color: '#888', marginBottom: 8, fontSize: 13 },
  stage: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f2f3f7',
    marginBottom: 16,
  },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 20, justifyContent: 'center' },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e8ee',
  },
  btnActive: { backgroundColor: '#91D7E4', borderColor: '#91D7E4' },
  btnText: { color: '#4A4A4A', fontWeight: '600', fontSize: 14 },
  btnTextActive: { color: '#fff' },
});
