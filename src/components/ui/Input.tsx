import React from "react";
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  View,
  Text,
} from "react-native";
import { THEME, RADIUS } from "../../styles/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={THEME.mutedForeground}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.foreground,
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.inputBackground,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 16,
    color: THEME.foreground,
  },
  inputError: {
    borderColor: THEME.destructive,
  },
  errorText: {
    fontSize: 12,
    color: THEME.destructive,
    marginTop: 4,
  },
});
