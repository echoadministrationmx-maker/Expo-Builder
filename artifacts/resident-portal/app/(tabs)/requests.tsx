import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { StatusPill } from '@/components/PortalUi';
import { useResident } from '@/context/ResidentContext';

export default function RequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { requests } = useResident();
  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 106 }]}
      ListHeaderComponent={
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>MANTENIMIENTO</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Solicitudes</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Mantén tu hogar en perfectas condiciones.
          </Text>
          <Pressable
            onPress={() => router.push('/request/new')}
            accessibilityRole="button"
            accessibilityLabel="Crear solicitud de mantenimiento"
            style={({ pressed }) => [
              styles.newButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.newButtonText, { color: colors.primaryForeground }]}>Nueva solicitud</Text>
          </Pressable>
          <Text style={[styles.listTitle, { color: colors.foreground }]}>Tus solicitudes</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.requestTop}>
            <View style={[styles.requestIcon, { backgroundColor: colors.accent }]}>
              <Feather name="tool" size={17} color={colors.accentForeground} />
            </View>
            <StatusPill status={item.status} />
          </View>
          <Text style={[styles.requestTitle, { color: colors.foreground }]}>{item.title}</Text>
          <Text style={[styles.requestDetail, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.detail}
          </Text>
          <Text style={[styles.requestDate, { color: colors.mutedForeground }]}>
            Enviado {item.createdAt}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="check-circle" size={28} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Todo en orden</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Cuando algo ocurra, puedes enviar una solicitud aquí.
          </Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1, lineHeight: 39 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 5 },
  newButton: { height: 50, borderRadius: 15, marginTop: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  newButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  listTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginTop: 30, marginBottom: 12 },
  requestCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  requestIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  requestTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  requestDetail: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 7 },
  requestDate: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 12 },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 25 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 12 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
});
