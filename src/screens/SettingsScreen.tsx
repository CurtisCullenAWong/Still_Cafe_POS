import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Text,
  TextInput,
  Button,
  Surface,
  useTheme,
  Switch,
  Divider,
} from "react-native-paper";
import { useDatabaseContext } from "../context/DatabaseContext";
import {
  Settings,
  Save,
  Download,
  Upload,
  Percent,
  AlertTriangle,
} from "lucide-react-native";

export function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { db, updateSettings, exportBackup, importBackup } =
    useDatabaseContext();

  const [vat, setVat] = useState("");
  const [senior, setSenior] = useState("");
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    if (db.settings) {
      setVat((db.settings.vat_percentage ?? 12).toString());
      setSenior((db.settings.senior_discount_percentage ?? 20).toString());
      setPwd((db.settings.pwd_discount_percentage ?? 20).toString());
    }
  }, [db.settings]);

  const handleSave = async () => {
    const vatVal = parseFloat(vat);
    const seniorVal = parseFloat(senior);
    const pwdVal = parseFloat(pwd);

    if (isNaN(vatVal) || isNaN(seniorVal) || isNaN(pwdVal)) {
      Alert.alert("Invalid Input", "Please enter valid numeric values.");
      return;
    }

    if (vatVal < 0 || seniorVal < 0 || pwdVal < 0) {
      Alert.alert("Invalid Input", "Values cannot be negative.");
      return;
    }

    if (seniorVal > 100 || pwdVal > 100) {
      Alert.alert("Invalid Input", "Discount percentages cannot exceed 100%.");
      return;
    }

    await updateSettings({
      vat_percentage: vatVal,
      senior_discount_percentage: seniorVal,
      pwd_discount_percentage: pwdVal,
    });

    Alert.alert("Success", "Settings updated successfully");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Settings
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
            System Configuration
          </Text>
        </View>
        <Save color={theme.colors.primary} size={24} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contentScroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeader}>
            <Percent size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
              Tax & Discounts
            </Text>
          </View>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.secondary, marginBottom: 16 }}
          >
            Set the default VAT rate and discount percentages for eligible
            customers.
          </Text>

          <View style={styles.inputGroup}>
            <TextInput
              mode="outlined"
              label="VAT Percentage"
              value={vat}
              onChangeText={setVat}
              keyboardType="numeric"
              right={<TextInput.Affix text="%" />}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Senior Citizen Discount"
              value={senior}
              onChangeText={setSenior}
              keyboardType="numeric"
              right={<TextInput.Affix text="%" />}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="PWD Discount"
              value={pwd}
              onChangeText={setPwd}
              keyboardType="numeric"
              right={<TextInput.Affix text="%" />}
              style={styles.input}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSave}
            style={{ marginTop: 16 }}
            icon={() => <Save size={18} color="#fff" />}
          >
            Save Configuration
          </Button>
        </Surface>

        <Surface style={styles.section} elevation={1}>
          <View style={styles.sectionHeader}>
            <Download size={20} color={theme.colors.secondary} />
            <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
              Data Management
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Button
              mode="outlined"
              onPress={exportBackup}
              icon={() => <Download size={18} color={theme.colors.primary} />}
              style={{ flex: 1 }}
            >
              Backup Data
            </Button>
            <Button
              mode="outlined"
              onPress={importBackup}
              icon={() => <Upload size={18} color={theme.colors.primary} />}
              style={{ flex: 1 }}
            >
              Restore Data
            </Button>
          </View>
        </Surface>

        <Surface
          style={[
            styles.section,
            { borderColor: theme.colors.errorContainer, borderWidth: 1 },
          ]}
          elevation={0}
        >
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={theme.colors.error} />
            <Text
              variant="titleMedium"
              style={{ fontWeight: "bold", color: theme.colors.error }}
            >
              Danger Zone
            </Text>
          </View>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.secondary, marginTop: 4 }}
          >
            Restoring data will overwrite all current sales and inventory
            records. This action cannot be undone.
          </Text>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
  },
  contentScroll: {
    padding: 12,
    gap: 12,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    backgroundColor: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});
