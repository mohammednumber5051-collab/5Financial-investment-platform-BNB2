import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WorkoutItem } from "@/components/WorkoutItem";
import { Badge, Body, Caption, Card, Display, Heading, Label, ProgressBar, StatCard, Title } from "@/components/ui";
import { formatDuration, getThisWeekWorkouts, getWeeklyDistance, mockProfile, mockWorkouts } from "@/data/mock";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const weekWorkouts = getThisWeekWorkouts(mockWorkouts);
  const weekDistance = getWeeklyDistance(mockWorkouts);
  const weekDuration = weekWorkouts.reduce((s, w) => s + w.durationSeconds, 0);
  const weekProgress = weekDistance / mockProfile.weeklyGoalKm;
  const recentWorkouts = mockWorkouts.slice(0, 3);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 100,
        paddingTop: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 16, gap: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Caption color={colors.mutedForeground}>{greeting}</Caption>
            <Heading>{mockProfile.name.split(" ")[0]}</Heading>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Badge label={mockProfile.level} variant="primary" />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="zap" size={12} color={colors.warning} />
              <Caption color={colors.warning} weight="semibold">
                {mockProfile.currentStreak} day streak
              </Caption>
            </View>
          </View>
        </View>

        {/* Weekly Goal Card */}
        <Card elevated style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Title>This Week</Title>
            <Caption color={colors.mutedForeground}>Goal: {mockProfile.weeklyGoalKm} km</Caption>
          </View>

          <View>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
              <Display color={colors.primary}>{weekDistance.toFixed(1)}</Display>
              <Label color={colors.mutedForeground}>/ {mockProfile.weeklyGoalKm} km</Label>
            </View>
            <ProgressBar progress={weekProgress} showPercent height={10} />
          </View>

          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Feather name="activity" size={14} color={colors.mutedForeground} />
              <Caption color={colors.mutedForeground}>
                {weekWorkouts.length} / {mockProfile.weeklyGoalWorkouts} runs
              </Caption>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Feather name="clock" size={14} color={colors.mutedForeground} />
              <Caption color={colors.mutedForeground}>{formatDuration(weekDuration)} total</Caption>
            </View>
          </View>
        </Card>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard
            label="Total Runs"
            value={`${mockProfile.totalRunsAllTime}`}
            icon="activity"
          />
          <StatCard
            label="Total Distance"
            value={`${mockProfile.totalDistanceAllTime.toFixed(0)}`}
            unit="km"
            icon="map"
            accent
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard
            label="Best Streak"
            value={`${mockProfile.longestStreak}`}
            unit="days"
            icon="zap"
          />
          <StatCard
            label="Longest Run"
            value="5.8"
            unit="km"
            icon="trending-up"
            trend={{ value: "+0.8 km", positive: true }}
          />
        </View>

        {/* Recent Workouts */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Title>Recent Runs</Title>
            <Body color={colors.primary} weight="medium">See all</Body>
          </View>
          {recentWorkouts.map((w) => (
            <WorkoutItem key={w.id} workout={w} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
