import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MonthlyChart } from "@/components/MonthlyChart";
import { WorkoutItem } from "@/components/WorkoutItem";
import { Badge, Body, Caption, Card, Divider, Heading, Label, ProgressBar, StatCard, Title } from "@/components/ui";
import { formatDuration, formatPace, mockGoals, mockMonthlyProgress, mockWorkouts } from "@/data/mock";
import { useColors } from "@/hooks/useColors";

type Tab = "overview" | "runs" | "goals";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const totalDist = mockWorkouts.reduce((s, w) => s + w.distanceKm, 0);
  const totalTime = mockWorkouts.reduce((s, w) => s + w.durationSeconds, 0);
  const avgPace = totalTime / 60 / totalDist;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100, gap: 20, paddingTop: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 16 }}>
        <Heading>Your Progress</Heading>
        <Caption color={colors.mutedForeground} style={{ marginTop: 2 }}>
          {mockWorkouts.length} total runs tracked
        </Caption>
      </View>

      {/* Tab Bar */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8 }}>
        {(["overview", "runs", "goals"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setActiveTab(t)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 10,
              borderRadius: (colors.radius ?? 12) - 2,
              backgroundColor: activeTab === t ? colors.primary : colors.muted,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Label
              color={activeTab === t ? colors.primaryForeground : colors.mutedForeground}
              weight={activeTab === t ? "semibold" : "regular"}
              style={{ textTransform: "capitalize" }}
            >
              {t}
            </Label>
          </Pressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {activeTab === "overview" && (
          <>
            {/* Summary Stats */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard label="Total Distance" value={`${totalDist.toFixed(0)}`} unit="km" icon="map" accent />
              <StatCard label="Total Time" value={formatDuration(totalTime)} icon="clock" />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard label="Avg Pace" value={formatPace(avgPace)} unit="min/km" icon="zap" />
              <StatCard label="Total Runs" value={`${mockWorkouts.length}`} icon="activity" />
            </View>

            {/* Monthly Distance Chart */}
            <Card style={{ gap: 14 }} elevated>
              <Title>Monthly Distance (km)</Title>
              <MonthlyChart data={mockMonthlyProgress} metric="distance" />
            </Card>

            {/* Monthly Workouts Chart */}
            <Card style={{ gap: 14 }}>
              <Title>Monthly Runs</Title>
              <MonthlyChart data={mockMonthlyProgress} metric="workouts" />
            </Card>

            {/* Progress highlights */}
            <Card style={{ gap: 12 }}>
              <Title>Personal Bests</Title>
              <Divider />
              <PBRow icon="activity" label="Longest Run" value="5.8 km" sub="May 2026" />
              <Divider />
              <PBRow icon="zap" label="Best Pace" value="5:58 /km" sub="May 28" />
              <Divider />
              <PBRow icon="calendar" label="Best Week" value="11.4 km" sub="Week of May 26" />
            </Card>
          </>
        )}

        {activeTab === "runs" && (
          <View style={{ gap: 12 }}>
            {mockWorkouts.map((w) => (
              <WorkoutItem key={w.id} workout={w} />
            ))}
          </View>
        )}

        {activeTab === "goals" && (
          <View style={{ gap: 12 }}>
            {mockGoals.map((goal) => {
              const progress = Math.min(1, goal.currentKm / goal.targetKm);
              const remaining = Math.max(0, goal.targetKm - goal.currentKm);
              return (
                <Card key={goal.id} style={{ gap: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Body weight="semibold">{goal.title}</Body>
                      <Caption color={colors.mutedForeground}>Due: {goal.deadline}</Caption>
                    </View>
                    {goal.completed ? (
                      <Badge label="Complete" variant="success" />
                    ) : (
                      <Badge label={`${remaining.toFixed(1)} km left`} variant="muted" />
                    )}
                  </View>
                  <ProgressBar
                    progress={progress}
                    label={`${goal.currentKm.toFixed(1)} / ${goal.targetKm} km`}
                    showPercent
                    color={goal.completed ? colors.success : colors.primary}
                  />
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function PBRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  sub: string;
}) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 2 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Caption color={colors.mutedForeground}>{label}</Caption>
        <Body weight="semibold">{value}</Body>
      </View>
      <Caption color={colors.mutedForeground}>{sub}</Caption>
    </View>
  );
}
