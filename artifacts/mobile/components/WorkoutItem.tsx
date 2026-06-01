import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { Workout } from "@/types";
import { formatDate, formatDuration, formatPace } from "@/data/mock";
import { Badge, Body, Caption, Card, Label } from "./ui";

const moodConfig: Record<
  Workout["mood"],
  { label: string; variant: "success" | "primary" | "warning" | "muted" }
> = {
  great: { label: "Great", variant: "success" },
  good: { label: "Good", variant: "primary" },
  okay: { label: "Okay", variant: "warning" },
  tough: { label: "Tough", variant: "muted" },
};

interface WorkoutItemProps {
  workout: Workout;
  onPress?: (workout: Workout) => void;
}

export function WorkoutItem({ workout, onPress }: WorkoutItemProps) {
  const colors = useColors();
  const mood = moodConfig[workout.mood];

  return (
    <Pressable
      onPress={() => onPress?.(workout)}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ gap: 2, flex: 1 }}>
            <Body weight="semibold">{formatDate(workout.date)}</Body>
            {workout.route ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                <Caption color={colors.mutedForeground}>{workout.route}</Caption>
              </View>
            ) : null}
          </View>
          <Badge label={mood.label} variant={mood.variant} />
        </View>

        <View style={{ flexDirection: "row", gap: 0 }}>
          <WorkoutStat icon="activity" value={`${workout.distanceKm.toFixed(1)}`} unit="km" />
          <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 12 }} />
          <WorkoutStat icon="clock" value={formatDuration(workout.durationSeconds)} unit="time" />
          <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 12 }} />
          <WorkoutStat icon="zap" value={formatPace(workout.pace)} unit="min/km" />
          <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 12 }} />
          <WorkoutStat icon="flame" value={`${workout.calories}`} unit="kcal" />
        </View>

        {workout.notes ? (
          <Caption color={colors.mutedForeground} style={{ fontStyle: "italic" }}>
            "{workout.notes}"
          </Caption>
        ) : null}
      </Card>
    </Pressable>
  );
}

function WorkoutStat({
  icon,
  value,
  unit,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: string;
  unit: string;
}) {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", gap: 2, flex: 1 }}>
      <Label weight="semibold" color={colors.foreground}>
        {value}
      </Label>
      <Caption color={colors.mutedForeground}>{unit}</Caption>
    </View>
  );
}
