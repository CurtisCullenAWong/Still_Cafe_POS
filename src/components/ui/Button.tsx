import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  ActivityIndicator,
} from "react-native";
import { THEME, RADIUS } from "../../styles/theme";

interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  label: string;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  label,
  loading,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return THEME.muted;
    switch (variant) {
      case "secondary":
        return THEME.secondary;
      case "destructive":
        return THEME.destructive;
      case "outline":
        return "transparent";
      case "ghost":
        return "transparent";
      default:
        return THEME.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return THEME.mutedForeground;
    switch (variant) {
      case "secondary":
        return THEME.secondaryForeground;
      case "destructive":
        return THEME.destructiveForeground;
      case "outline":
        return THEME.foreground;
      case "ghost":
        return THEME.foreground;
      default:
        return THEME.primaryForeground;
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") return THEME.border;
    return "transparent";
  };

  const getPadding = () => {
    switch (size) {
      case "sm":
        return 8;
      case "lg":
        return 16;
      default:
        return 12;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 1 : 0,
          padding: getPadding(),
        },
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontWeight: "600",
    fontSize: 16,
  },
});
