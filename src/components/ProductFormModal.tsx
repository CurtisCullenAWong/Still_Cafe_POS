import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  useTheme,
  Surface,
  HelperText,
  IconButton,
} from "react-native-paper";
import { Product } from "../types/db";
import * as ImagePicker from "expo-image-picker";
import { Camera, X } from "lucide-react-native";

interface ProductFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (productData: Omit<Product, "id" | "created_at">) => void;
  initialData?: Product;
}

export function ProductFormModal({
  visible,
  onDismiss,
  onSubmit,
  initialData,
}: ProductFormModalProps) {
  const theme = useTheme();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name);
        setCategory(initialData.category);
        setPrice(initialData.price.toString());
        setStock(initialData.stock_qty.toString());
        setImageUri(initialData.image_uri);
      } else {
        // Reset for new product
        setName("");
        setCategory("");
        setPrice("");
        setStock("");
        setImageUri(undefined);
      }
      setErrors({});
    }
  }, [visible, initialData]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!category.trim()) newErrors.category = "Category is required";
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      newErrors.price = "Valid price is required";
    }
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      newErrors.stock = "Valid stock quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      name,
      category,
      price: parseFloat(price),
      stock_qty: parseInt(stock),
      image_uri: imageUri,
    });
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Surface style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            {initialData ? "Edit Product" : "New Product"}
          </Text>

          <View style={styles.imageSection}>
            <TouchableOpacity
              onPress={pickImage}
              style={[
                styles.imagePicker,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              {imageUri ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.image} />
                  <IconButton
                    icon={() => <X size={20} color="white" />}
                    style={styles.removeImageBtn}
                    onPress={() => setImageUri(undefined)}
                  />
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Camera size={32} color={theme.colors.onSurfaceVariant} />
                  <Text
                    variant="labelMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Add Image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View>
              <TextInput
                mode="outlined"
                label="Product Name"
                value={name}
                onChangeText={setName}
                error={!!errors.name}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>
            </View>

            <View>
              <TextInput
                mode="outlined"
                label="Category"
                value={category}
                onChangeText={setCategory}
                error={!!errors.category}
                placeholder="e.g. Coffee, Pastry"
              />
              <HelperText type="error" visible={!!errors.category}>
                {errors.category}
              </HelperText>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <TextInput
                  mode="outlined"
                  label="Price"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  left={<TextInput.Affix text="₱ " />}
                  error={!!errors.price}
                />
                <HelperText type="error" visible={!!errors.price}>
                  {errors.price}
                </HelperText>
              </View>

              <View style={styles.col}>
                <TextInput
                  mode="outlined"
                  label="Stock"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  error={!!errors.stock}
                />
                <HelperText type="error" visible={!!errors.stock}>
                  {errors.stock}
                </HelperText>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button onPress={onDismiss} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSubmit} style={{ flex: 1 }}>
              Save
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
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    gap: 24,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
  },
  form: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  col: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  imageSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  removeImageBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
