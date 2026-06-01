import React from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  elevated?: boolean;
}

export function Card({ children, style, padding = 16, elevated = false }: CardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius ?? 12,
          padding,
          borderWidth: 1,
          borderColor: colors.border,
          ...(elevated
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
