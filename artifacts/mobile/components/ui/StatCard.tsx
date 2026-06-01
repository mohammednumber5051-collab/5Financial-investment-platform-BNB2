import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Caption, Display, Label } from "./Typography";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  accent?: boolean;
  trend?: { value: string; positive: boolean };
}

export function StatCard({ label, value, unit, icon, accent = false, trend }: StatCardProps) {
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: accent ? colors.primarySoft : colors.card,
        borderRadius: colors.radius ?? 12,
        padding: 16,
        borderWidth: 1,
        borderColor: accent ? colors.primaryLight + "33" : colors.border,
        gap: 10,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: accent ? colors.primary + "22" : colors.muted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={18} color={accent ? colors.primary : colors.mutedForeground} />
      </View>

      <View>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
          <Display
            style={{ fontSize: 28, lineHeight: 34 }}
            color={accent ? colors.primary : colors.foreground}
          >
            {value}
          </Display>
          {unit ? (
            <Caption color={accent ? colors.primaryLight : colors.mutedForeground}>{unit}</Caption>
          ) : null}
        </View>
        <Label color={accent ? colors.primary + "BB" : colors.mutedForeground}>{label}</Label>
      </View>

      {trend ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Feather
            name={trend.positive ? "trending-up" : "trending-down"}
            size={12}
            color={trend.positive ? colors.success : colors.destructive}
          />
          <Caption color={trend.positive ? colors.success : colors.destructive}>
            {trend.value}
          </Caption>
        </View>
      ) : null}
    </View>
  );
}
