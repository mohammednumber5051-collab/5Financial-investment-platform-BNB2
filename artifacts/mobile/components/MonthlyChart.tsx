import React from "react";
import { View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { MonthlyProgress } from "@/types";
import { Caption, Label } from "./ui/Typography";

interface MonthlyChartProps {
  data: MonthlyProgress[];
  metric?: "distance" | "workouts";
}

export function MonthlyChart({ data, metric = "distance" }: MonthlyChartProps) {
  const colors = useColors();

  const values = data.map((d) =>
    metric === "distance" ? d.totalDistanceKm : d.totalWorkouts,
  );
  const max = Math.max(...values, 1);

  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 6,
          height: 100,
        }}
      >
        {data.map((item, i) => {
          const val = values[i] ?? 0;
          const heightPct = val / max;
          const isLast = i === data.length - 1;
          return (
            <View key={item.month} style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <Caption color={isLast ? colors.primary : colors.mutedForeground} weight={isLast ? "semibold" : "regular"}>
                {metric === "distance" ? `${val.toFixed(0)}` : `${val}`}
              </Caption>
              <View style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}>
                <View
                  style={{
                    height: `${Math.max(heightPct * 100, 4)}%`,
                    backgroundColor: isLast ? colors.primary : colors.primary + "44",
                    borderRadius: 6,
                    minHeight: 4,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: "row", gap: 6 }}>
        {data.map((item, i) => {
          const isLast = i === data.length - 1;
          const shortLabel = item.month.split(" ")[0] ?? item.month;
          return (
            <View key={item.month} style={{ flex: 1, alignItems: "center" }}>
              <Caption
                color={isLast ? colors.primary : colors.mutedForeground}
                weight={isLast ? "semibold" : "regular"}
              >
                {shortLabel}
              </Caption>
            </View>
          );
        })}
      </View>
    </View>
  );
}
