// Admin pickups management screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { ewasteService } from '@/services/ewasteService';
import { useAlert } from '@/template';

const PICKUP_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: theme.colors.warning, icon: 'schedule' },
  { value: 'in_progress', label: 'In Progress', color: theme.colors.info, icon: 'local-shipping' },
  { value: 'completed', label: 'Completed', color: theme.colors.success, icon: 'check-circle' },
  { value: 'cancelled', label: 'Cancelled', color: theme.colors.error, icon: 'cancel' },
];

export default function AdminPickupsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [pickups, setPickups] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadPickups();
  }, []);

  const loadPickups = async () => {
    const { data } = await ewasteService.getAllPickups();
    if (data) setPickups(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPickups();
    setRefreshing(false);
  };

  const updatePickupStatus = async (pickupId: string, newStatus: string) => {
    const { error } = await ewasteService.updatePickupStatus(pickupId, newStatus);
    if (error) {
      showAlert('Error', error);
      return;
    }
    showAlert('Success', 'Pickup status updated');
    loadPickups();
  };

  const filteredPickups = filter === 'all' 
    ? pickups 
    : pickups.filter(pickup => pickup.status === filter);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Pickups Management</Text>
            <Text style={styles.subtitle}>{pickups.length} total pickups</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {PICKUP_STATUS_OPTIONS.map((status) => {
              const count = pickups.filter(p => p.status === status.value).length;
              return (
                <Pressable
                  key={status.value}
                  style={[
                    styles.filterChip,
                    filter === status.value && styles.filterChipActive,
                    filter === status.value && { borderColor: status.color },
                  ]}
                  onPress={() => setFilter(status.value)}
                >
                  <MaterialIcons name={status.icon as any} size={18} color={filter === status.value ? status.color : theme.colors.textMuted} />
                  <Text style={[
                    styles.filterText,
                    filter === status.value && { color: status.color },
                  ]}>
                    {status.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Pickups List */}
        <View style={styles.section}>
          {filteredPickups.map((pickup) => {
            const statusConfig = PICKUP_STATUS_OPTIONS.find(s => s.value === pickup.status);
            return (
              <View key={pickup.id} style={styles.pickupCard}>
                <View style={styles.pickupHeader}>
                  <View style={[styles.pickupTypeIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                    <MaterialIcons 
                      name={pickup.pickup_type === 'home_pickup' ? 'home' : 'location-on'} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={styles.pickupTitleSection}>
                    <Text style={styles.pickupType}>
                      {pickup.pickup_type === 'home_pickup' ? 'Home Pickup' : 'Drop-off'}
                    </Text>
                    <Text style={styles.pickupUser}>
                      User: {(pickup as any).user_profiles?.email?.split('@')[0] || 'Unknown'}
                    </Text>
                  </View>
                </View>

                <View style={styles.pickupDetails}>
                  <View style={styles.pickupRow}>
                    <MaterialIcons name="calendar-today" size={18} color={theme.colors.textMuted} />
                    <Text style={styles.pickupDetailText}>
                      {new Date(pickup.scheduled_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>

                  <View style={styles.pickupRow}>
                    <MaterialIcons name="access-time" size={18} color={theme.colors.textMuted} />
                    <Text style={styles.pickupDetailText}>{pickup.scheduled_time}</Text>
                  </View>

                  {pickup.address && (
                    <View style={styles.pickupRow}>
                      <MaterialIcons name="place" size={18} color={theme.colors.textMuted} />
                      <Text style={styles.pickupDetailText} numberOfLines={2}>{pickup.address}</Text>
                    </View>
                  )}

                  {pickup.phone && (
                    <View style={styles.pickupRow}>
                      <MaterialIcons name="phone" size={18} color={theme.colors.textMuted} />
                      <Text style={styles.pickupDetailText}>{pickup.phone}</Text>
                    </View>
                  )}

                  {(pickup as any).ewaste_items && (
                    <View style={styles.linkedItemBadge}>
                      <MaterialIcons name="devices" size={16} color={theme.colors.primary} />
                      <Text style={styles.linkedItemText}>
                        {(pickup as any).ewaste_items.device_type} × {(pickup as any).ewaste_items.quantity}
                      </Text>
                    </View>
                  )}

                  {pickup.notes && (
                    <Text style={styles.pickupNotes}>Note: {pickup.notes}</Text>
                  )}
                </View>

                {/* Status Update */}
                <View style={styles.statusSection}>
                  <Text style={styles.statusLabel}>Update Status:</Text>
                  <View style={styles.statusButtons}>
                    {PICKUP_STATUS_OPTIONS.map((status) => (
                      <Pressable
                        key={status.value}
                        style={[
                          styles.statusButton,
                          pickup.status === status.value && styles.statusButtonActive,
                          pickup.status === status.value && { backgroundColor: status.color + '20', borderColor: status.color },
                        ]}
                        onPress={() => updatePickupStatus(pickup.id, status.value)}
                      >
                        <MaterialIcons 
                          name={status.icon as any} 
                          size={16} 
                          color={pickup.status === status.value ? status.color : theme.colors.textMuted} 
                        />
                        <Text style={[
                          styles.statusButtonText,
                          pickup.status === status.value && { color: status.color },
                        ]}>
                          {status.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            );
          })}

          {filteredPickups.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="local-shipping" size={64} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No {filter} pickups</Text>
            </View>
          )}
        </View>

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
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  filterSection: {
    marginBottom: theme.spacing.md,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: {
    borderWidth: 2,
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  pickupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pickupTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupTitleSection: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  pickupType: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  pickupUser: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  pickupDetails: {
    gap: theme.spacing.sm,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  pickupDetailText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  linkedItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  linkedItemText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  pickupNotes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  statusSection: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statusLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusButtonActive: {
    borderWidth: 2,
  },
  statusButtonText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
});