import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useResident } from "@/context/ResidentContext";
import { useColors } from "@/hooks/useColors";

export default function EntryScreen() {
  const colors = useColors();
  const { isLoading, isSignedIn } = useResident();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? "/(tabs)" : "/login"} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
