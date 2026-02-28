// E-waste registration screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ewasteService } from '@/services/ewasteService';
import { useEwaste } from '@/hooks/useEwaste';
import { useAlert } from '@/template';
import { getSupabaseClient } from '@/template';

const DEVICE_TYPES = [
  { value: 'phone', label: 'Phone', icon: 'smartphone', points: 10 },
  { value: 'laptop', label: 'Laptop', icon: 'laptop', points: 25 },
  { value: 'tablet', label: 'Tablet', icon: 'tablet', points: 15 },
  { value: 'monitor', label: 'Monitor', icon: 'desktop-windows', points: 20 },
  { value: 'keyboard', label: 'Keyboard', icon: 'keyboard', points: 5 },
  { value: 'mouse', label: 'Mouse', icon: 'mouse', points: 3 },
  { value: 'cables', label: 'Cables/Wires', icon: 'cable', points: 2 },
  { value: 'pcb', label: 'PCB/Circuit Board', icon: 'memory', points: 30 },
  { value: 'other', label: 'Other', icon: 'devices-other', points: 5 },
];

const CONDITIONS = [
  { value: 'working', label: 'Working', color: theme.colors.success },
  { value: 'partially_working', label: 'Partially Working', color: theme.colors.warning },
  { value: 'not_working', label: 'Not Working', color: theme.colors.error },
  { value: 'broken', label: 'Broken/Damaged', color: theme.colors.textMuted },
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { refreshData } = useEwaste();
  const { showAlert } = useAlert();

  const [deviceType, setDeviceType] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedDevice = DEVICE_TYPES.find(d => d.value === deviceType);
  const selectedCondition = CONDITIONS.find(c => c.value === condition);
  const estimatedPoints = selectedDevice ? selectedDevice.points * parseInt(quantity || '1') : 0;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      const supabase = getSupabaseClient();
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `ewaste_${Date.now()}.jpg`;
      const filePath = `ewaste-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ewaste-images')
        .upload(filePath, blob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('ewaste-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!deviceType) {
      showAlert('Required Field', 'Please select device type');
      return;
    }

    if (!condition) {
      showAlert('Required Field', 'Please select device condition');
      return;
    }

    if (!photo) {
      showAlert('Photo Required', 'Please upload a photo of your e-waste item');
      return;
    }

    setLoading(true);
    try {
      // Upload photo
      const photoUrl = await uploadPhoto(photo);
      if (!photoUrl) {
        showAlert('Upload Failed', 'Could not upload photo. Please try again.');
        setLoading(false);
        return;
      }

      // Create item
      const { data, error } = await ewasteService.createEwasteItem({
        device_type: deviceType,
        quantity: parseInt(quantity),
        condition,
        description,
        photo_url: photoUrl,
      });

      if (error) {
        showAlert('Error', error);
        return;
      }

      showAlert('Success!', `E-waste item registered! You'll earn ${estimatedPoints} points once collected.`);
      
      // Reset form
      setDeviceType('');
      setQuantity('1');
      setCondition('');
      setDescription('');
      setPhoto(null);

      // Refresh data
      await refreshData();
    } catch (error) {
      showAlert('Error', 'Failed to register item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Register E-waste</Text>
          <Text style={styles.subtitle}>Add electronic devices for recycling</Text>
        </View>

        {/* Device Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Device Type *</Text>
          <View style={styles.deviceGrid}>
            {DEVICE_TYPES.map((device) => (
              <Pressable
                key={device.value}
                style={({ pressed }) => [
                  styles.deviceCard,
                  deviceType === device.value && styles.deviceCardActive,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => setDeviceType(device.value)}
              >
                <MaterialIcons 
                  name={device.icon as any} 
                  size={28} 
                  color={deviceType === device.value ? theme.colors.primary : theme.colors.textMuted} 
                />
                <Text style={[
                  styles.deviceLabel,
                  deviceType === device.value && styles.deviceLabelActive,
                ]}>
                  {device.label}
                </Text>
                <Text style={styles.devicePoints}>{device.points} pts</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.quantityContainer}>
            <Pressable
              style={styles.quantityButton}
              onPress={() => setQuantity(String(Math.max(1, parseInt(quantity) - 1)))}
            >
              <MaterialIcons name="remove" size={24} color={theme.colors.text} />
            </Pressable>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />
            <Pressable
              style={styles.quantityButton}
              onPress={() => setQuantity(String(parseInt(quantity) + 1))}
            >
              <MaterialIcons name="add" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.label}>Condition *</Text>
          <View style={styles.conditionGrid}>
            {CONDITIONS.map((cond) => (
              <Pressable
                key={cond.value}
                style={({ pressed }) => [
                  styles.conditionCard,
                  condition === cond.value && styles.conditionCardActive,
                  condition === cond.value && { borderColor: cond.color },
                  pressed && styles.cardPressed,
                ]}
                onPress={() => setCondition(cond.value)}
              >
                <View style={[styles.conditionDot, { backgroundColor: cond.color }]} />
                <Text style={[
                  styles.conditionLabel,
                  condition === cond.value && styles.conditionLabelActive,
                ]}>
                  {cond.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Photo */}
        <View style={styles.section}>
          <Text style={styles.label}>Photo *</Text>
          <Pressable style={styles.photoButton} onPress={pickImage}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialIcons name="add-a-photo" size={48} color={theme.colors.textMuted} />
                <Text style={styles.photoText}>Tap to upload photo</Text>
              </View>
            )}
          </Pressable>
          {photo && (
            <Pressable style={styles.changePhotoButton} onPress={pickImage}>
              <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </Pressable>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add any additional details about the device..."
            placeholderTextColor={theme.colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Estimated Points */}
        {selectedDevice && (
          <View style={styles.pointsCard}>
            <LinearGradient
              colors={[theme.colors.primary + '20', theme.colors.primaryDark + '20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pointsGradient}
            >
              <MaterialIcons name="stars" size={32} color={theme.colors.gold} />
              <View style={styles.pointsContent}>
                <Text style={styles.pointsLabel}>Estimated Points</Text>
                <Text style={styles.pointsValue}>{estimatedPoints} Points</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Registering...' : 'Register E-waste'}
            </Text>
          </LinearGradient>
        </Pressable>

        <View style={{ height: theme.spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  deviceCard: {
    width: '30%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deviceCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  deviceLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  deviceLabelActive: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  devicePoints: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gold,
    fontWeight: theme.fontWeight.medium,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  quantityButton: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quantityInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  conditionGrid: {
    gap: theme.spacing.sm,
  },
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  conditionCardActive: {
    backgroundColor: theme.colors.surface,
  },
  conditionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  conditionLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  conditionLabelActive: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  photoButton: {
    aspectRatio: 4 / 3,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  photoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  changePhotoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pointsCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadow.md,
  },
  pointsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  pointsContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  pointsLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  pointsValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  submitButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadow.lg,
  },
  gradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md + 2,
  },
  submitButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cardPressed: {
    opacity: 0.7,
  },
});