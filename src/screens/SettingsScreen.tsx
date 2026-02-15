import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, TextInput, Button, Surface, useTheme } from "react-native-paper";
import { useDB } from "../context/DatabaseContext";

export function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { db, updateSettings, exportBackup, importBackup } = useDB();

  const [vat, setVat] = useState("");
  const [senior, setSenior] = useState("");
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    if (db.settings) {
      setVat(db.settings.vat_percentage.toString());
      setSenior(db.settings.senior_discount_percentage.toString());
      setPwd(db.settings.pwd_discount_percentage.toString());
    }
  }, [db.settings]);

  const handleSave = () => {
    const vatVal = parseFloat(vat);
    const seniorVal = parseFloat(senior);
    const pwdVal = parseFloat(pwd);

    if (isNaN(vatVal) || isNaN(seniorVal) || isNaN(pwdVal)) {
      Alert.alert("Error", "Please enter valid numbers");
      return;
    }

    updateSettings({
      vat_percentage: vatVal,
      senior_discount_percentage: seniorVal,
      pwd_discount_percentage: pwdVal,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Settings
          </Text>
        </View>

        <View style={styles.content}>
          <Surface style={styles.section} elevation={1}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Tax & Discounts
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.secondary, marginBottom: 16 }}
            >
              Configure global tax rates and discount percentages.
            </Text>

            <View style={styles.form}>
              <TextInput
                mode="outlined"
                label="VAT Percentage (%)"
                value={vat}
                onChangeText={setVat}
                keyboardType="numeric"
                right={<TextInput.Affix text="%" />}
              />

              <TextInput
                mode="outlined"
                label="Senior Citizen Discount (%)"
                value={senior}
                onChangeText={setSenior}
                keyboardType="numeric"
                right={<TextInput.Affix text="%" />}
              />

              <TextInput
                mode="outlined"
                label="PWD Discount (%)"
                value={pwd}
                onChangeText={setPwd}
                keyboardType="numeric"
                right={<TextInput.Affix text="%" />}
              />

              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.saveBtn}
                contentStyle={{ height: 48 }}
              >
                Save Changes
              </Button>
            </View>
          </Surface>

          <Surface style={styles.section} elevation={1}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Data Management
            </Text>
            <View style={styles.dataActions}>
              <Button mode="outlined" icon="download" onPress={exportBackup}>
                Backup Data
              </Button>
              <Button mode="outlined" icon="upload" onPress={importBackup}>
                Restore Data
              </Button>
            </View>
          </Surface>
        </View>
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
    padding: 24,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontWeight: "bold",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  form: {
    gap: 16,
  },
  saveBtn: {
    marginTop: 8,
  },
  dataActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
});
