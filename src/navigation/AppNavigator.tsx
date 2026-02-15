import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ShoppingCart,
  Package,
  LayoutDashboard,
  Settings as SettingsIcon,
} from "lucide-react-native";

// Screens
import { SalesScreen } from "../screens/SalesScreen";
import { InventoryScreen } from "../screens/InventoryScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { RootStackParamList } from "../types/navigation";

const Tab = createBottomTabNavigator<RootStackParamList>();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#5c1414", // Cafe Red
    onPrimary: "#ffffff",
    primaryContainer: "#efebe0", // Light beige
    onPrimaryContainer: "#5c1414",
    secondary: "#420d0d", // Dark Red
    onSecondary: "#ffffff",
    secondaryContainer: "#f3f0e8",
    onSecondaryContainer: "#420d0d",
    background: "#fdfbf7", // Cream
    onBackground: "#420d0d",
    surface: "#ffffff",
    onSurface: "#420d0d",
    surfaceVariant: "#f3f0e8",
    onSurfaceVariant: "#8a7a7a",
    outline: "#e6e2d6",
  },
};

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#5c1414",
    background: "#fdfbf7",
    card: "#ffffff",
    text: "#420d0d",
    border: "#e6e2d6",
    notification: "#d4183d",
  },
};

export function AppNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          initialRouteName="Sales"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
              if (route.name === "Sales") {
                return <ShoppingCart size={size} color={color} />;
              } else if (route.name === "Inventory") {
                return <Package size={size} color={color} />;
              } else if (route.name === "Reports") {
                return <LayoutDashboard size={size} color={color} />;
              } else if (route.name === "Settings") {
                return <SettingsIcon size={size} color={color} />;
              }
              return null;
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: "gray",
            tabBarStyle: {
              height: 60 + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 10),
              paddingTop: 10,
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderTopColor: theme.colors.outline,
              elevation: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "500",
            },
          })}
        >
          <Tab.Screen
            name="Sales"
            component={SalesScreen}
            options={{ tabBarLabel: "POS" }}
          />
          <Tab.Screen name="Inventory" component={InventoryScreen} />
          <Tab.Screen name="Reports" component={ReportsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
