import { Feather } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useResident } from '@/context/ResidentContext';
import { IconButton } from '@/components/PortalUi';

export default function AnnouncementDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { announcements } = useResident();
  const announcement = announcements.find((item) => item.id === id);

  if (!announcement) {
    return <View style={[styles.missing, { backgroundColor: colors.background }]}><Text style={[styles.missingText, { color: colors.foreground }]}>Announcement unavailable.</Text></View>;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><IconButton icon="arrow-left" label="Go back" onPress={() => router.back()} /><Pressable accessibilityRole="button" accessibilityLabel="Save announcement" hitSlop={8}><Feather name="bookmark" size={20} color={colors.foreground} /></Pressable></View>
        <Text style={[styles.category, { color: colors.primary }]}>{announcement.category.toUpperCase()}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{announcement.title}</Text>
        <View style={styles.meta}><Text style={[styles.date, { color: colors.mutedForeground }]}>{announcement.date}</Text><View style={[styles.dot, { backgroundColor: colors.border }]} /><Text style={[styles.date, { color: colors.mutedForeground }]}>{announcement.readTime}</Text></View>
        <View style={[styles.feature, { backgroundColor: colors.secondary }]}><Feather name="home" size={34} color={colors.foreground} /><View style={[styles.featureLine, { backgroundColor: colors.primary }]} /></View>
        <Text style={[styles.body, { color: colors.foreground }]}>{announcement.body}</Text>
        <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="info" size={17} color={colors.primary} /><Text style={[styles.noteText, { color: colors.mutedForeground }]}>If you have questions, reach out to the concierge team from the building office.</Text></View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 38 },
  category: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.4, marginBottom: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1, lineHeight: 39 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  date: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  feature: { height: 165, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 30, overflow: 'hidden' },
  featureLine: { position: 'absolute', width: 90, height: 5, borderRadius: 3, bottom: 34 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 27, marginTop: 28 },
  note: { borderWidth: 1, borderRadius: 16, padding: 15, flexDirection: 'row', gap: 10, marginTop: 28 },
  noteText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
});