import "dotenv/config";

export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    name: process.env.EXPO_PUBLIC_APP_NAME || "Still Café POS",
    slug: process.env.EXPO_PUBLIC_SLUG || "still-cafe-pos",
    version: process.env.EXPO_PUBLIC_VERSION || "1.0.0",
    scheme: process.env.EXPO_PUBLIC_APP_SCHEME || "still-cafe-pos",
    orientation: "default",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#F8FAFC",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.stillcafe.pos",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#F8FAFC",
      },
      package: "com.stillcafe.pos",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "e6256b07-37f5-4e8f-8bd6-f5ce3d239fa2",
      },
    },
    owner: "curtiswong",
  },
});
