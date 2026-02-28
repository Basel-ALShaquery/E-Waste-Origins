// Schedule pickup screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ewasteService } from '@/services/ewasteService';
import { useEwaste } from '@/hooks/useEwaste';
import { useAlert } from '@/template';

const TIME_SLOTS = [
  '9:00 AM - 12:00 PM',
  '12:00 PM - 3:00 PM',
  '3:00 PM - 6:00 PM',
];

export default function SchedulePickupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userItems, refreshData } = useEwaste();
  const { showAlert } = useAlert();

  const [pickupType, setPickupType] = useState<'home_pickup' | 'drop_off'>('home_pickup');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [dropOffLocations, setDropOffLocations] = useState<any[]>([]);

  const pendingItems = userItems.filter(item => item.status === 'pending');

  useEffect(() => {
    loadDropOffLocations();
  }, []);

  const loadDropOffLocations = async () => {
    const { data } = await ewasteService.getDropOffLocations();
    if (data) setDropOffLocations(data);
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const handleSubmit = async () => {
    if (pickupType === 'home_pickup') {
      if (!selectedDate || !selectedTime || !address || !phone) {
        showAlert('Required Fields', 'Please fill in all required fields');
        return;
      }
    } else {
      if (!selectedDate || !selectedTime) {
        showAlert('Required Fields', 'Please select date and time');
        return;
      }
    }

    setLoading(true);
    try {
      const { data, error } = await ewasteService.schedulePickup({
        ewaste_item_id: selectedItem || undefined,
        pickup_type: pickupType,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        address: pickupType === 'home_pickup' ? address : undefined,
        phone: pickupType === 'home_pickup' ? phone : undefined,
        notes,
      });

      if (error) {
        showAlert('Error', error);
        return;
      }

      showAlert('Success!', 'Pickup scheduled successfully. Our team will contact you soon.');
      await refreshData();
      router.back();
    } catch (error) {
      showAlert('Error', 'Failed to schedule pickup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={28} color={theme.colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Schedule Pickup</Text>
            <Text style={styles.subtitle}>Book a collection slot</Text>
          </View>
        </View>

        {/* Pickup Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Pickup Type *</Text>
          <View style={styles.typeButtons}>
            <Pressable
              style={[
                styles.typeButton,
                pickupType === 'home_pickup' && styles.typeButtonActive,
              ]}
              onPress={() => setPickupType('home_pickup')}
            >
              <MaterialIcons 
                name="home" 
                size={32} 
                color={pickupType === 'home_pickup' ? theme.colors.primary : theme.colors.textMuted} 
              />
              <Text style={[
                styles.typeButtonText,
                pickupType === 'home_pickup' && styles.typeButtonTextActive,
              ]}>
                Home Pickup
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.typeButton,
                pickupType === 'drop_off' && styles.typeButtonActive,
              ]}
              onPress={() => setPickupType('drop_off')}
            >
              <MaterialIcons 
                name="location-on" 
                size={32} 
                color={pickupType === 'drop_off' ? theme.colors.primary : theme.colors.textMuted} 
              />
              <Text style={[
                styles.typeButtonText,
                pickupType === 'drop_off' && styles.typeButtonTextActive,
              ]}>
                Drop-off
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Link to Item */}
        {pendingItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Link to E-waste Item (Optional)</Text>
            <View style={styles.itemsContainer}>
              <Pressable
                style={[
                  styles.itemOption,
                  !selectedItem && styles.itemOptionActive,
                ]}
                onPress={() => setSelectedItem('')}
              >
                <Text style={[
                  styles.itemOptionText,
                  !selectedItem && styles.itemOptionTextActive,
                ]}>
                  General Pickup
                </Text>
              </Pressable>
              {pendingItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.itemOption,
                    selectedItem === item.id && styles.itemOptionActive,
                  ]}
                  onPress={() => setSelectedItem(item.id)}
                >
                  <MaterialIcons name="devices" size={20} color={theme.colors.primary} />
                  <Text style={[
                    styles.itemOptionText,
                    selectedItem === item.id && styles.itemOptionTextActive,
                  ]}>
                    {item.device_type} × {item.quantity}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Preferred Date *</Text>
          <View style={styles.dateGrid}>
            {generateDateOptions().map((date) => {
              const dateObj = new Date(date);
              const isSelected = selectedDate === date;
              return (
                <Pressable
                  key={date}
                  style={[
                    styles.dateCard,
                    isSelected && styles.dateCardActive,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dateDay,
                    isSelected && styles.dateDayActive,
                  ]}>
                    {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={[
                    styles.dateNumber,
                    isSelected && styles.dateNumberActive,
                  ]}>
                    {dateObj.getDate()}
                  </Text>
                  <Text style={[
                    styles.dateMonth,
                    isSelected && styles.dateMonthActive,
                  ]}>
                    {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Preferred Time *</Text>
          <View style={styles.timeSlots}>
            {TIME_SLOTS.map((time) => (
              <Pressable
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.timeSlotActive,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <MaterialIcons 
                  name="access-time" 
                  size={20} 
                  color={selectedTime === time ? theme.colors.primary : theme.colors.textMuted} 
                />
                <Text style={[
                  styles.timeSlotText,
                  selectedTime === time && styles.timeSlotTextActive,
                ]}>
                  {time}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Home Pickup Details */}
        {pickupType === 'home_pickup' && (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Pickup Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full address"
                placeholderTextColor={theme.colors.textMuted}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Contact Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="+20 XXX XXX XXXX"
                placeholderTextColor={theme.colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </>
        )}

        {/* Drop-off Locations */}
        {pickupType === 'drop_off' && dropOffLocations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Available Drop-off Locations</Text>
            {dropOffLocations.map((location) => (
              <View key={location.id} style={styles.locationCard}>
                <MaterialIcons name="location-on" size={24} color={theme.colors.primary} />
                <View style={styles.locationContent}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                  {location.hours && (
                    <Text style={styles.locationHours}>{location.hours}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Any special instructions or details..."
            placeholderTextColor={theme.colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

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
            <MaterialIcons name="event-available" size={24} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Scheduling...' : 'Confirm Pickup'}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
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
  typeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  typeButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  typeButtonTextActive: {
    color: theme.colors.text,
  },
  itemsContainer: {
    gap: theme.spacing.sm,
  },
  itemOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  itemOptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  itemOptionTextActive: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  dateCard: {
    width: '13%',
    aspectRatio: 0.7,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  dateDay: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  dateDayActive: {
    color: theme.colors.primary,
  },
  dateNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  dateNumberActive: {
    color: theme.colors.primary,
  },
  dateMonth: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  dateMonthActive: {
    color: theme.colors.primary,
  },
  timeSlots: {
    gap: theme.spacing.sm,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSlotActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  timeSlotText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  timeSlotTextActive: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  locationContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  locationName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  locationAddress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  locationHours: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  submitButton: {
    marginHorizontal: theme.spacing.lg,
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
});