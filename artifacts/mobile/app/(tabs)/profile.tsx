import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge, Body, Caption, Card, Divider, Heading, Label, ProgressBar, StatCard, Title } from "@/components/ui";
import { mockProfile } from "@/data/mock";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [metric, setMetric] = useState(true);

  const joinDate = new Date(mockProfile.joinedDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100, gap: 20, paddingTop: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 16, gap: 20 }}>
        {/* Profile Header */}
        <Card elevated style={{ alignItems: "center", gap: 12, paddingVertical: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="user" size={32} color={colors.primary} />
          </View>
          <View style={{ alignItems: "center", gap: 4 }}>
            <Heading>{mockProfile.name}</Heading>
            <Caption color={colors.mutedForeground}>Runner since {joinDate}</Caption>
          </View>
          <Badge label={mockProfile.level} variant="primary" />
        </Card>

        {/* Streak & Achievements */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard
            label="Current Streak"
            value={`${mockProfile.currentStreak}`}
            unit="days"
            icon="zap"
            accent
            trend={{ value: "Keep going!", positive: true }}
          />
          <StatCard
            label="Best Streak"
            value={`${mockProfile.longestStreak}`}
            unit="days"
            icon="award"
          />
        </View>

        {/* Weekly Goals */}
        <Card style={{ gap: 14 }}>
          <Title>Weekly Goals</Title>
          <ProgressBar
            label={`Distance: ${mockProfile.weeklyGoalKm} km / week`}
            progress={0.4}
            showPercent
          />
          <ProgressBar
            label={`Runs: ${mockProfile.weeklyGoalWorkouts} per week`}
            progress={0.67}
            showPercent
            color={colors.success}
          />
        </Card>

        {/* Lifetime Stats */}
        <Card style={{ gap: 12 }}>
          <Title>Lifetime Stats</Title>
          <Divider />
          <StatRow icon="activity" label="Total Runs" value={`${mockProfile.totalRunsAllTime}`} />
          <Divider />
          <StatRow icon="map" label="Total Distance" value={`${mockProfile.totalDistanceAllTime.toFixed(1)} km`} />
          <Divider />
          <StatRow icon="trending-up" label="Fitness Level" value={mockProfile.level} />
        </Card>

        {/* Settings */}
        <Card style={{ gap: 0 }}>
          <Title style={{ marginBottom: 12 }}>Settings</Title>
          <SettingRow
            icon="bell"
            label="Run Reminders"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.muted, true: colors.primaryLight }}
                thumbColor={notifications ? colors.primary : colors.mutedForeground}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="moon"
            label="Dark Mode"
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.muted, true: colors.primaryLight }}
                thumbColor={darkMode ? colors.primary : colors.mutedForeground}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="globe"
            label="Units"
            right={
              <Pressable
                onPress={() => setMetric(!metric)}
                style={{
                  flexDirection: "row",
                  borderRadius: 8,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {["km", "mi"].map((u) => (
                  <View
                    key={u}
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 12,
                      backgroundColor: (u === "km") === metric ? colors.primary : colors.background,
                    }}
                  >
                    <Label color={(u === "km") === metric ? colors.primaryForeground : colors.mutedForeground}>
                      {u}
                    </Label>
                  </View>
                ))}
              </Pressable>
            }
          />
          <Divider />
          <SettingRow icon="target" label="Weekly Distance Goal" right={<Label color={colors.primary} weight="semibold">{mockProfile.weeklyGoalKm} km</Label>} />
        </Card>

        {/* About */}
        <Card style={{ gap: 12 }}>
          <SettingRow icon="info" label="App Version" right={<Caption color={colors.mutedForeground}>1.0.0</Caption>} />
          <Divider />
          <SettingRow icon="heart" label="Made for beginner runners" right={<Badge label="RunStart" variant="primary" />} />
        </Card>
      </View>
    </ScrollView>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <Body style={{ flex: 1 }} color={colors.mutedForeground}>{label}</Body>
      <Body weight="semibold">{value}</Body>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  right,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  right: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
      <Feather name={icon} size={18} color={colors.mutedForeground} />
      <Body style={{ flex: 1 }}>{label}</Body>
      {right}
    </View>
  );
}
