import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { SectionTitle } from '@/components/PortalUi';

const payments = [
  { date: 'Jun 01, 2026', label: 'Monthly dues', amount: '$485.00', status: 'Paid' },
  { date: 'May 01, 2026', label: 'Monthly dues', amount: '$485.00', status: 'Paid' },
  { date: 'Apr 01, 2026', label: 'Monthly dues', amount: '$485.00', status: 'Paid' },
  { date: 'Mar 01, 2026', label: 'Monthly dues', amount: '$485.00', status: 'Paid' },
];

export default function PaymentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 104 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>FINANCIAL OVERVIEW</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Payments</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Unit 4B · 88 Willow Street</Text>

      <View style={[styles.balanceCard, { backgroundColor: colors.foreground }]}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
          <View style={styles.paidBadge}><Feather name="check" size={12} color="#dceee4" /><Text style={styles.paidBadgeText}>Up to date</Text></View>
        </View>
        <Text style={styles.balance}>$0.00</Text>
        <Text style={styles.balanceNote}>Your next payment of $485.00 is due Jul 01, 2026.</Text>
      </View>

      <SectionTitle title="Payment history" />
      <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {payments.map((payment, index) => (
          <View key={payment.date} style={[styles.paymentRow, index < payments.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={[styles.paymentIcon, { backgroundColor: colors.secondary }]}><Feather name="arrow-up-right" size={16} color={colors.foreground} /></View>
            <View style={styles.paymentInfo}><Text style={[styles.paymentLabel, { color: colors.foreground }]}>{payment.label}</Text><Text style={[styles.paymentDate, { color: colors.mutedForeground }]}>{payment.date}</Text></View>
            <View style={styles.paymentAmount}><Text style={[styles.amount, { color: colors.foreground }]}>{payment.amount}</Text><Text style={[styles.paid, { color: '#3e9471' }]}>{payment.status}</Text></View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1, lineHeight: 39 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 5, marginBottom: 26 },
  balanceCard: { borderRadius: 22, padding: 22, marginBottom: 28 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: '#b9c4ca', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.3 },
  paidBadge: { backgroundColor: 'rgba(220,238,228,0.16)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  paidBadgeText: { color: '#dceee4', fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  balance: { color: '#fffdf9', fontFamily: 'Inter_700Bold', fontSize: 42, letterSpacing: -1.5, marginTop: 20 },
  balanceNote: { color: '#b9c4ca', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 260 },
  historyCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  paymentRow: { minHeight: 82, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  paymentDate: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 5 },
  paymentAmount: { alignItems: 'flex-end' },
  amount: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  paid: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 5 },
});