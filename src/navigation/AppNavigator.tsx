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
import { Platform, Pressable, useWindowDimensions, View } from "react-native";

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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const safeBottom = Math.max(insets.bottom, isTablet ? 20 : 12);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          initialRouteName="Sales"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarIcon: ({ color, size, focused }) => {
              const iconSize = focused ? 26 : 24;
              if (route.name === "Sales") {
                return <ShoppingCart size={iconSize} color={color} />;
              } else if (route.name === "Inventory") {
                return <Package size={iconSize} color={color} />;
              } else if (route.name === "Reports") {
                return <LayoutDashboard size={iconSize} color={color} />;
              } else if (route.name === "Settings") {
                return <SettingsIcon size={iconSize} color={color} />;
              }
              return null;
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
            tabBarStyle: {
              paddingBottom: safeBottom,
              paddingTop: 12,
              height: 58 + safeBottom,
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderTopColor: theme.colors.outline,
              elevation: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "600",
              marginTop: 4,
            },
            tabBarButton: (props) => {
              const { style, children, ref, ...rest } = props as any;
              const isFirstTab = route.name === "Sales";

              return (
                <View
                  style={[
                    style,
                    { flexDirection: "row", alignItems: "center" },
                  ]}
                >
                  {!isFirstTab && (
                    <View
                      style={{
                        width: 1,
                        height: "40%",
                        backgroundColor: theme.colors.outline,
                        position: "absolute",
                        left: 0,
                        zIndex: 1,
                      }}
                    />
                  )}
                  <Pressable
                    {...rest}
                    android_ripple={{
                      color: theme.colors.primary + "15",
                      borderless: true,
                    }}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: Platform.OS === "ios" && pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    {children}
                  </Pressable>
                </View>
              );
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
