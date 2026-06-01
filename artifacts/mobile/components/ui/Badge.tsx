import React from "react";
import { View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Label } from "./Typography";

type BadgeVariant = "primary" | "success" | "warning" | "muted" | "destructive";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "muted" }: BadgeProps) {
  const colors = useColors();

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    primary: { bg: colors.primarySoft, text: colors.primary },
    success: { bg: colors.successSoft, text: colors.success },
    warning: { bg: colors.warningSoft, text: colors.warning },
    muted: { bg: colors.muted, text: colors.mutedForeground },
    destructive: { bg: colors.destructive + "18", text: colors.destructive },
  };

  const vs = variantMap[variant];

  return (
    <View
      style={{
        backgroundColor: vs.bg,
        borderRadius: 100,
        paddingVertical: 3,
        paddingHorizontal: 10,
        alignSelf: "flex-start",
      }}
    >
      <Label color={vs.text} style={{ fontSize: 11 }}>
        {label}
      </Label>
    </View>
  );
}
