import React from "react";
import { View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Caption } from "./Typography";

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercent?: boolean;
  height?: number;
  color?: string;
}

export function ProgressBar({
  progress,
  label,
  showPercent = false,
  height = 8,
  color,
}: ProgressBarProps) {
  const colors = useColors();
  const clamped = Math.min(1, Math.max(0, progress));
  const fillColor = color ?? colors.primary;

  return (
    <View style={{ gap: 6 }}>
      {(label || showPercent) && (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {label ? <Caption color={colors.mutedForeground}>{label}</Caption> : <View />}
          {showPercent ? (
            <Caption color={colors.primary} weight="semibold">
              {Math.round(clamped * 100)}%
            </Caption>
          ) : null}
        </View>
      )}
      <View
        style={{
          height,
          backgroundColor: colors.muted,
          borderRadius: height,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${clamped * 100}%`,
            height: "100%",
            backgroundColor: fillColor,
            borderRadius: height,
          }}
        />
      </View>
    </View>
  );
}
