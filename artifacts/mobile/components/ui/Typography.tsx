import React from "react";
import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface TypographyProps extends TextProps {
  variant?: "display" | "heading" | "title" | "body" | "caption" | "label";
  weight?: "regular" | "medium" | "semibold" | "bold";
  color?: string;
  align?: TextStyle["textAlign"];
  children: React.ReactNode;
}

const fontFamilies: Record<NonNullable<TypographyProps["weight"]>, string> = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

const fontSizes: Record<NonNullable<TypographyProps["variant"]>, number> = {
  display: 36,
  heading: 26,
  title: 20,
  body: 15,
  caption: 12,
  label: 13,
};

const lineHeights: Record<NonNullable<TypographyProps["variant"]>, number> = {
  display: 44,
  heading: 34,
  title: 28,
  body: 22,
  caption: 18,
  label: 20,
};

const defaultWeights: Record<NonNullable<TypographyProps["variant"]>, TypographyProps["weight"]> = {
  display: "bold",
  heading: "bold",
  title: "semibold",
  body: "regular",
  caption: "regular",
  label: "medium",
};

export function Typography({
  variant = "body",
  weight,
  color,
  align,
  style,
  children,
  ...rest
}: TypographyProps) {
  const colors = useColors();
  const resolvedWeight = weight ?? defaultWeights[variant];

  return (
    <Text
      style={[
        {
          fontFamily: fontFamilies[resolvedWeight ?? "regular"],
          fontSize: fontSizes[variant],
          lineHeight: lineHeights[variant],
          color: color ?? colors.foreground,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function Display(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="display" {...props} />;
}

export function Heading(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="heading" {...props} />;
}

export function Title(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="title" {...props} />;
}

export function Body(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="body" {...props} />;
}

export function Caption(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="caption" {...props} />;
}

export function Label(props: Omit<TypographyProps, "variant">) {
  return <Typography variant="label" {...props} />;
}
