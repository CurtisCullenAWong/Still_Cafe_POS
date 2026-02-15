import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  SegmentedButtons,
  useTheme,
  Surface,
} from "react-native-paper";
import { Settings } from "../types/db";

interface PaymentModalProps {
  visible: boolean;
  onDismiss: () => void;
  checkoutDetails: any;
  settings: Settings;
  onComplete: (
    method: "cash" | "gcash",
    amount: number,
    change: number,
  ) => void;
}

export function PaymentModal({
  visible,
  onDismiss,
  checkoutDetails,
  settings,
  onComplete,
}: PaymentModalProps) {
  const theme = useTheme();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [change, setChange] = useState(0);

  useEffect(() => {
    if (visible) {
      setAmountReceived("");
      setChange(0);
      setPaymentMethod("cash");
    }
  }, [visible]);

  useEffect(() => {
    if (checkoutDetails) {
      const received = parseFloat(amountReceived) || 0;
      setChange(Math.max(0, received - checkoutDetails.finalAmount));
    }
  }, [amountReceived, checkoutDetails]);

  if (!checkoutDetails) return null;

  const handleComplete = () => {
    const received = parseFloat(amountReceived) || 0;
    if (received < checkoutDetails.finalAmount) return; // Validation
    onComplete(paymentMethod, received, change);
    onDismiss();
  };

  const isInvalid =
    (parseFloat(amountReceived) || 0) < checkoutDetails.finalAmount;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Surface
          style={[styles.content, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.title}>
            Payment
          </Text>

          <View style={styles.summary}>
            <Text variant="bodyLarge">Total Amount Due</Text>
            <Text
              variant="displaySmall"
              style={{ color: theme.colors.primary, fontWeight: "bold" }}
            >
              ₱{checkoutDetails.finalAmount.toFixed(2)}
            </Text>
          </View>

          <SegmentedButtons
            value={paymentMethod}
            onValueChange={(val) => setPaymentMethod(val as "cash" | "gcash")}
            buttons={[
              { value: "cash", label: "Cash" },
              { value: "gcash", label: "GCash" },
            ]}
            style={styles.segmentedBtn}
          />

          <TextInput
            mode="outlined"
            label="Amount Received"
            value={amountReceived}
            onChangeText={setAmountReceived}
            keyboardType="numeric"
            left={<TextInput.Affix text="₱ " />}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            autoFocus
          />

          <View
            style={[
              styles.changeContainer,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text variant="titleMedium">Change</Text>
            <Text
              variant="headlineMedium"
              style={{
                color: change > 0 ? theme.colors.primary : theme.colors.outline,
              }}
            >
              ₱{change.toFixed(2)}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button onPress={onDismiss} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleComplete}
              disabled={isInvalid}
              style={{ flex: 1 }}
              contentStyle={{ height: 48 }}
            >
              Complete
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    gap: 24,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
  },
  summary: {
    alignItems: "center",
    gap: 8,
  },
  segmentedBtn: {
    marginBottom: 8,
  },
  input: {
    fontSize: 24,
  },
  changeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
});
