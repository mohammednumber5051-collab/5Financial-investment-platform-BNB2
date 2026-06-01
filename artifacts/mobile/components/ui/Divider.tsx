import React from "react";
import { View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface DividerProps {
  vertical?: boolean;
  spacing?: number;
}

export function Divider({ vertical = false, spacing = 0 }: DividerProps) {
  const colors = useColors();

  if (vertical) {
    return (
      <View
        style={{
          width: 1,
          backgroundColor: colors.border,
          marginHorizontal: spacing,
        }}
      />
    );
  }

  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing,
      }}
    />
  );
}
