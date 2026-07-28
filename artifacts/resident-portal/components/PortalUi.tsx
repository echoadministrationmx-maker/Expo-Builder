import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { RequestStatus, requestStatusLabel } from '@/lib/residentData';

export function IconButton({
  icon,
  onPress,
  label,
  style,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  label: string;
  style?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Feather name={icon} size={19} color={colors.foreground} />
    </Pressable>
  );
}

export function StatusPill({ status }: { status: RequestStatus }) {
  const colors = useColors();
  const isResolved = status === 'resuelto';
  const isOpen = status === 'pendiente';
  return (
    <View
      style={[
        styles.statusPill,
        {
          backgroundColor: isResolved ? '#dceee4' : isOpen ? '#f5e7bd' : colors.accent,
        },
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: isResolved ? '#3e9471' : isOpen ? '#b7812a' : colors.primary,
          },
        ]}
      />
      <Text
        style={[
          styles.statusText,
          {
            color: isResolved ? '#2d6f53' : isOpen ? '#80601e' : colors.accentForeground,
          },
        ]}
      >
        {requestStatusLabel(status)}
      </Text>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.3,
  },
  sectionAction: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
