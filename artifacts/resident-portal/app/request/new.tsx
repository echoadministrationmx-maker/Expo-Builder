import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { IconButton } from '@/components/PortalUi';
import { useResident } from '@/context/ResidentContext';

export default function NewRequestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addRequest } = useResident();
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (title.trim().length < 3 || detail.trim().length < 8) {
      setError('Add a short title and a few details so we can help.');
      return;
    }
    await addRequest(title.trim(), detail.trim());
    router.replace('/(tabs)/requests');
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 18 }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}><IconButton icon="arrow-left" label="Go back" onPress={() => router.back()} /><Text style={[styles.headerTitle, { color: colors.foreground }]}>New request</Text><View style={styles.headerSpacer} /></View>
      <View style={styles.body}>
        <View style={[styles.introIcon, { backgroundColor: colors.accent }]}><Feather name="tool" size={22} color={colors.accentForeground} /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>What can we help with?</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Tell the building team a little about what’s happening in your home.</Text>
        <Text style={[styles.label, { color: colors.foreground }]}>Subject</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Bedroom light is flickering" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input }]} />
        <Text style={[styles.label, { color: colors.foreground }]}>Details</Text>
        <TextInput value={detail} onChangeText={setDetail} multiline textAlignVertical="top" placeholder="Add any details that might help..." placeholderTextColor={colors.mutedForeground} style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input }]} />
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      </View>
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <Pressable onPress={submit} accessibilityRole="button" accessibilityLabel="Submit maintenance request" style={({ pressed }) => [styles.submit, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Submit request</Text><Feather name="arrow-up-right" size={17} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  headerSpacer: { width: 42 },
  body: { flex: 1, paddingTop: 36 },
  introIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.8, lineHeight: 34 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 28, maxWidth: 325 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 8 },
  input: { height: 54, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontFamily: 'Inter_400Regular', fontSize: 14, marginBottom: 18 },
  textarea: { height: 140, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, paddingTop: 15, fontFamily: 'Inter_400Regular', fontSize: 14 },
  error: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 9 },
  bottom: { paddingTop: 15 },
  submit: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  submitText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});