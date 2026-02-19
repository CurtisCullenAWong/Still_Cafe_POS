import React, { createContext, useContext, ReactNode } from "react";
import { useDB } from "../hooks/useDB";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

type DatabaseContextType = ReturnType<typeof useDB>;

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const dbState = useDB();

  if (!dbState.loaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading POS...</Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={dbState}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error(
      "useDatabaseContext must be used within a DatabaseProvider",
    );
  }
  return context;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});
