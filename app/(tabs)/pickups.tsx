// Pickups management screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useEwaste } from '@/hooks/useEwaste';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const STATUS_CONFIG = {
  pending: { color: theme.colors.warning, icon: 'schedule', label: 'Pending' },
  in_progress: { color: theme.colors.info, icon: 'local-shipping', label: 'In Progress' },
  completed: { color: theme.colors.success, icon: 'check-circle', label: 'Completed' },
  cancelled: { color: theme.colors.error, icon: 'cancel', label: 'Cancelled' },
};

export default function PickupsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userPickups, refreshData } = useEwaste();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const pendingPickups = userPickups.filter(p => p.status === 'pending');
  const completedPickups = userPickups.filter(p => p.status === 'completed');

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
            <Text style={styles.title}>Pickups</Text>
            <Text style={styles.subtitle}>{userPickups.length} total pickups</Text>
          </View>
        </View>

        {/* Schedule New Pickup Button */}
        <Pressable
          style={({ pressed }) => [
            styles.scheduleButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push('/schedule-pickup')}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scheduleGradient}
          >
            <MaterialIcons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.scheduleButtonText}>Schedule New Pickup</Text>
          </LinearGradient>
        </Pressable>

        {/* Pending Pickups */}
        {pendingPickups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending ({pendingPickups.length})</Text>
            {pendingPickups.map((pickup) => {
              const status = STATUS_CONFIG[pickup.status as keyof typeof STATUS_CONFIG];
              return (
                <View key={pickup.id} style={styles.pickupCard}>
                  <View style={styles.pickupHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                      <MaterialIcons name={status.icon as any} size={16} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                    <MaterialIcons 
                      name={pickup.pickup_type === 'home_pickup' ? 'home' : 'location-on'} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  </View>

                  <View style={styles.pickupContent}>
                    <View style={styles.pickupRow}>
                      <MaterialIcons name="calendar-today" size={20} color={theme.colors.textMuted} />
                      <Text style={styles.pickupText}>
                        {new Date(pickup.scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={styles.pickupRow}>
                      <MaterialIcons name="access-time" size={20} color={theme.colors.textMuted} />
                      <Text style={styles.pickupText}>{pickup.scheduled_time}</Text>
                    </View>

                    {pickup.pickup_type === 'home_pickup' && pickup.address && (
                      <View style={styles.pickupRow}>
                        <MaterialIcons name="place" size={20} color={theme.colors.textMuted} />
                        <Text style={styles.pickupText} numberOfLines={2}>{pickup.address}</Text>
                      </View>
                    )}

                    {(pickup as any).ewaste_items && (
                      <View style={styles.itemTag}>
                        <MaterialIcons name="devices" size={16} color={theme.colors.primary} />
                        <Text style={styles.itemTagText}>
                          {(pickup as any).ewaste_items.device_type} × {(pickup as any).ewaste_items.quantity}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Completed Pickups */}
        {completedPickups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed ({completedPickups.length})</Text>
            {completedPickups.slice(0, 5).map((pickup) => {
              const status = STATUS_CONFIG[pickup.status as keyof typeof STATUS_CONFIG];
              return (
                <View key={pickup.id} style={[styles.pickupCard, styles.pickupCardCompleted]}>
                  <View style={styles.pickupHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                      <MaterialIcons name={status.icon as any} size={16} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pickupContent}>
                    <View style={styles.pickupRow}>
                      <MaterialIcons name="calendar-today" size={20} color={theme.colors.textMuted} />
                      <Text style={styles.pickupText}>
                        {new Date(pickup.scheduled_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>

                    {(pickup as any).ewaste_items && (
                      <View style={styles.itemTag}>
                        <MaterialIcons name="check" size={16} color={theme.colors.success} />
                        <Text style={styles.itemTagText}>
                          {(pickup as any).ewaste_items.device_type} collected
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {userPickups.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="local-shipping" size={80} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Pickups Yet</Text>
            <Text style={styles.emptySubtitle}>
              Register your e-waste items and schedule a pickup to get started
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/(tabs)/register')}
            >
              <Text style={styles.emptyButtonText}>Register E-waste</Text>
            </Pressable>
          </View>
        )}

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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  scheduleButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadow.md,
  },
  scheduleGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  scheduleButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  section: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  pickupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickupCardCompleted: {
    opacity: 0.7,
  },
  pickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  pickupContent: {
    gap: theme.spacing.sm,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pickupText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  itemTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  itemTagText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  emptyButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});