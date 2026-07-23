import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { IconButton, SectionTitle, StatusPill } from '@/components/PortalUi';
import { useResident } from '@/context/ResidentContext';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { residentName, announcements, requests, signOut } = useResident();
  const [refreshing, setRefreshing] = useState(false);
  const firstName = residentName.split(' ')[0] || 'there';
  const activeRequest = requests[0];

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 650);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 104 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View><Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning,</Text><Text style={[styles.name, { color: colors.foreground }]}>{firstName}.</Text></View>
        <View style={styles.headerActions}><IconButton icon="bell" label="Notifications" onPress={() => {}} /><Pressable onPress={() => void signOut()} accessibilityRole="button" accessibilityLabel="Sign out" style={[styles.avatar, { backgroundColor: colors.foreground }]}><Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text></Pressable></View>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <View style={styles.cardTop}><Text style={styles.cardLabel}>YOUR ACCOUNT</Text><Feather name="arrow-up-right" size={19} color="rgba(255,255,255,0.8)" /></View>
        <Text style={styles.balance}>$0.00</Text>
        <Text style={styles.balanceSub}>Current balance</Text>
        <View style={styles.cardBottom}><Text style={styles.dueText}>Next payment Jul 01</Text><View style={styles.upToDate}><Feather name="check" size={12} color={colors.primary} /><Text style={[styles.upToDateText, { color: colors.primary }]}>Up to date</Text></View></View>
      </View>

      <View style={styles.quickActions}>
        <Pressable onPress={() => router.push('/(tabs)/payments')} style={({ pressed }) => [styles.quickItem, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}><View style={[styles.quickIcon, { backgroundColor: colors.secondary }]}><Feather name="credit-card" size={18} color={colors.foreground} /></View><Text style={[styles.quickText, { color: colors.foreground }]}>Payments</Text></Pressable>
        <Pressable onPress={() => router.push('/request/new')} style={({ pressed }) => [styles.quickItem, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}><View style={[styles.quickIcon, { backgroundColor: colors.accent }]}><Feather name="tool" size={18} color={colors.accentForeground} /></View><Text style={[styles.quickText, { color: colors.foreground }]}>Request help</Text></Pressable>
      </View>

      <SectionTitle title="Building news" action="See all" onAction={() => {}} />
      <View style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {announcements.slice(0, 2).map((item, index) => (
          <Pressable key={item.id} onPress={() => router.push(`/announcement/${item.id}`)} style={({ pressed }) => [styles.newsRow, index === 0 && { borderBottomWidth: 1, borderBottomColor: colors.border }, { opacity: pressed ? 0.68 : 1 }]}>
            <View style={[styles.newsIcon, { backgroundColor: index === 0 ? colors.secondary : colors.accent }]}><Feather name={index === 0 ? 'sun' : 'users'} size={17} color={index === 0 ? colors.foreground : colors.accentForeground} /></View>
            <View style={styles.newsCopy}><Text style={[styles.newsTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text><Text style={[styles.newsExcerpt, { color: colors.mutedForeground }]} numberOfLines={1}>{item.excerpt}</Text><Text style={[styles.newsDate, { color: colors.mutedForeground }]}>{item.date}</Text></View>
            <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <SectionTitle title="Maintenance" action="View all" onAction={() => router.push('/(tabs)/requests')} />
      <Pressable onPress={() => router.push('/(tabs)/requests')} style={[styles.maintenanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.maintenanceIcon, { backgroundColor: colors.accent }]}><Feather name="tool" size={18} color={colors.accentForeground} /></View>
        {activeRequest ? <View style={styles.maintenanceCopy}><Text style={[styles.maintenanceTitle, { color: colors.foreground }]} numberOfLines={1}>{activeRequest.title}</Text><Text style={[styles.maintenanceDate, { color: colors.mutedForeground }]}>Submitted {activeRequest.createdAt}</Text></View> : <View style={styles.maintenanceCopy}><Text style={[styles.maintenanceTitle, { color: colors.foreground }]}>Everything looks good</Text><Text style={[styles.maintenanceDate, { color: colors.mutedForeground }]}>No active requests</Text></View>}
        {activeRequest ? <StatusPill status={activeRequest.status} /> : <Feather name="check-circle" size={21} color="#3e9471" />}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.7, marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fffdf9', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  balanceCard: { borderRadius: 22, padding: 20, minHeight: 185 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 },
  balance: { color: '#fffdf9', fontFamily: 'Inter_700Bold', fontSize: 44, letterSpacing: -1.7, marginTop: 20 },
  balanceSub: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 23 },
  dueText: { color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter_400Regular', fontSize: 12 },
  upToDate: { backgroundColor: '#fffdf9', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  upToDateText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  quickActions: { flexDirection: 'row', gap: 10, marginVertical: 25 },
  quickItem: { flex: 1, minHeight: 84, borderRadius: 18, borderWidth: 1, padding: 13, justifyContent: 'space-between' },
  quickIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  newsCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 27 },
  newsRow: { minHeight: 92, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  newsIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  newsCopy: { flex: 1 },
  newsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  newsExcerpt: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  newsDate: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 6 },
  maintenanceCard: { borderRadius: 18, borderWidth: 1, minHeight: 75, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  maintenanceIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  maintenanceCopy: { flex: 1 },
  maintenanceTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  maintenanceDate: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 5 },
});
