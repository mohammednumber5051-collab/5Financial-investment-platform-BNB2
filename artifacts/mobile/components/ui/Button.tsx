import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  haptic?: boolean;
}

const paddingBySize: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14 },
  md: { paddingVertical: 13, paddingHorizontal: 22 },
  lg: { paddingVertical: 17, paddingHorizontal: 28 },
};

const fontSizeBySize: Record<ButtonSize, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  haptic = true,
}: ButtonProps) {
  const colors = useColors();

  const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary: { bg: colors.primary, text: colors.primaryForeground },
    secondary: { bg: colors.secondary, text: colors.secondaryForeground },
    ghost: { bg: "transparent", text: colors.primary },
    destructive: { bg: colors.destructive, text: colors.destructiveForeground },
    outline: { bg: "transparent", text: colors.primary, border: colors.primary },
  };

  const vs = variantStyles[variant];

  async function handlePress() {
    if (haptic && Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: vs.bg,
          borderRadius: colors.radius ?? 12,
          borderWidth: vs.border ? 1.5 : 0,
          borderColor: vs.border,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          flexDirection: "row" as const,
          gap: 8,
          opacity: pressed ? 0.82 : disabled ? 0.5 : 1,
          ...(fullWidth ? { width: "100%" as const } : { alignSelf: "flex-start" as const }),
          ...paddingBySize[size],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : null}
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: fontSizeBySize[size],
          color: vs.text,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
