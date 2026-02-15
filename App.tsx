import React from "react";
import { DatabaseProvider } from "./src/context/DatabaseContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <AppNavigator />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
