import React, { createContext, useContext, ReactNode } from "react";
import { useDatabase } from "../hooks/useDatabase";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

type DatabaseContextType = ReturnType<typeof useDatabase>;

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const dbState = useDatabase();

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

export function useDB() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDB must be used within a DatabaseProvider");
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
