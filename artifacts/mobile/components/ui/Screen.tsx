import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  padding?: number;
  keyboardAware?: boolean;
}

export function Screen({
  children,
  scroll = false,
  style,
  contentStyle,
  padding = 16,
  keyboardAware = false,
}: ScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const baseStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const innerStyle: ViewStyle = {
    padding,
    paddingBottom: insets.bottom + 16,
    ...(Platform.OS === "web" ? { paddingTop: 67, paddingBottom: 34 + 16 } : {}),
  };

  const content = scroll ? (
    <ScrollView
      style={[baseStyle, style]}
      contentContainerStyle={[innerStyle, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[baseStyle, style]}>
      <View style={[innerStyle, contentStyle]}>{children}</View>
    </View>
  );

  if (keyboardAware) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}
