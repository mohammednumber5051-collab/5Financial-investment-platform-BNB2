import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge, Body, Button, Caption, Card, Heading, Label, Title } from "@/components/ui";
import type { MoodType } from "@/types";
import { useColors } from "@/hooks/useColors";

const MOODS: { value: MoodType; label: string; icon: string }[] = [
  { value: "great", label: "Great", icon: "😄" },
  { value: "good", label: "Good", icon: "🙂" },
  { value: "okay", label: "Okay", icon: "😐" },
  { value: "tough", label: "Tough", icon: "😓" },
];

const ROUTES = ["Park Loop", "River Trail", "Neighborhood", "City Streets", "Track", "Other"];

export default function LogWorkoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [distanceKm, setDistanceKm] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [mood, setMood] = useState<MoodType | null>(null);
  const [route, setRoute] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const totalSeconds =
    (parseInt(hours || "0") * 3600) +
    (parseInt(minutes || "0") * 60) +
    parseInt(seconds || "0");

  const distVal = parseFloat(distanceKm);
  const pace = totalSeconds > 0 && distVal > 0 ? totalSeconds / 60 / distVal : null;

  const canSave = distVal > 0 && totalSeconds > 0 && mood !== null;

  function handleSave() {
    if (!canSave) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setDistanceKm("");
      setHours("");
      setMinutes("");
      setSeconds("");
      setMood(null);
      setRoute(null);
      setNotes("");
    }, 2000);
  }

  if (saved) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
          <Feather name="check" size={36} color={colors.success} />
        </View>
        <Heading color={colors.success}>Run Saved!</Heading>
        <Caption color={colors.mutedForeground}>Great work. Keep it up!</Caption>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 100, gap: 20 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Distance */}
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="activity" size={18} color={colors.primary} />
          <Title>Distance</Title>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TextInput
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="0.0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            style={{
              flex: 1,
              fontSize: 32,
              fontFamily: "Inter_700Bold",
              color: colors.foreground,
              borderBottomWidth: 2,
              borderBottomColor: distanceKm ? colors.primary : colors.border,
              paddingVertical: 8,
            }}
          />
          <Label color={colors.mutedForeground}>km</Label>
        </View>
      </Card>

      {/* Duration */}
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="clock" size={18} color={colors.primary} />
          <Title>Duration</Title>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <DurationField value={hours} onChange={setHours} placeholder="00" label="h" max={23} />
          <Caption color={colors.mutedForeground} style={{ fontSize: 24 }}>:</Caption>
          <DurationField value={minutes} onChange={setMinutes} placeholder="00" label="m" max={59} />
          <Caption color={colors.mutedForeground} style={{ fontSize: 24 }}>:</Caption>
          <DurationField value={seconds} onChange={setSeconds} placeholder="00" label="s" max={59} />
        </View>
        {pace !== null && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Feather name="zap" size={13} color={colors.mutedForeground} />
            <Caption color={colors.mutedForeground}>
              Pace: {Math.floor(pace)}:{Math.round((pace % 1) * 60).toString().padStart(2, "0")} min/km
            </Caption>
          </View>
        )}
      </Card>

      {/* Mood */}
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="heart" size={18} color={colors.primary} />
          <Title>How did it feel?</Title>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {MOODS.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => setMood(m.value)}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: "center",
                paddingVertical: 12,
                borderRadius: (colors.radius ?? 12) - 2,
                borderWidth: 1.5,
                borderColor: mood === m.value ? colors.primary : colors.border,
                backgroundColor: mood === m.value ? colors.primarySoft : colors.background,
                opacity: pressed ? 0.8 : 1,
                gap: 4,
              })}
            >
              <Body>{m.icon}</Body>
              <Caption
                color={mood === m.value ? colors.primary : colors.mutedForeground}
                weight={mood === m.value ? "semibold" : "regular"}
              >
                {m.label}
              </Caption>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Route */}
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="map-pin" size={18} color={colors.primary} />
          <Title>Route</Title>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ROUTES.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRoute(route === r ? null : r)}
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 100,
                borderWidth: 1.5,
                borderColor: route === r ? colors.primary : colors.border,
                backgroundColor: route === r ? colors.primarySoft : colors.background,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Label
                color={route === r ? colors.primary : colors.mutedForeground}
                weight={route === r ? "semibold" : "regular"}
              >
                {r}
              </Label>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Notes */}
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="edit-2" size={18} color={colors.primary} />
          <Title>Notes</Title>
        </View>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="How was your run? Any highlights?"
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            color: colors.foreground,
            minHeight: 72,
            textAlignVertical: "top",
            borderWidth: 1,
            borderColor: notes ? colors.primary : colors.border,
            borderRadius: 8,
            padding: 12,
          }}
        />
      </Card>

      <Button
        label={canSave ? "Save Run" : "Fill in distance & duration"}
        onPress={handleSave}
        disabled={!canSave}
        fullWidth
        size="lg"
      />
    </ScrollView>
  );
}

function DurationField({
  value,
  onChange,
  placeholder,
  label,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  max: number;
}) {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <TextInput
        value={value}
        onChangeText={(v) => {
          const n = parseInt(v);
          if (v === "" || (!isNaN(n) && n <= max)) onChange(v);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType="number-pad"
        maxLength={2}
        style={{
          fontFamily: "Inter_700Bold",
          fontSize: 28,
          color: colors.foreground,
          textAlign: "center",
          borderBottomWidth: 2,
          borderBottomColor: value ? colors.primary : colors.border,
          paddingVertical: 4,
          width: "100%",
        }}
      />
      <Caption color={colors.mutedForeground}>{label}</Caption>
    </View>
  );
}
