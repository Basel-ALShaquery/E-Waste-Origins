// Admin dashboard screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/template';
import { theme } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ewasteService } from '@/services/ewasteService';

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentPickups, setRecentPickups] = useState<any[]>([]);
  const [recentItems, setRecentItems] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [statsRes, pickupsRes, itemsRes] = await Promise.all([
      ewasteService.getAdminStats(),
      ewasteService.getAllPickups(),
      ewasteService.getAllEwasteItems(),
    ]);

    if (statsRes.data) setStats(statsRes.data);
    if (pickupsRes.data) setRecentPickups(pickupsRes.data.slice(0, 5));
    if (itemsRes.data) setRecentItems(itemsRes.data.slice(0, 5));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

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
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <Text style={styles.username}>{user?.email?.split('@')[0] || 'Admin'}</Text>
          </View>
          <View style={styles.adminBadge}>
            <MaterialIcons name="admin-panel-settings" size={24} color={theme.colors.primary} />
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <MaterialIcons name="inventory" size={32} color="#FFFFFF" />
              <Text style={styles.statValue}>{stats?.totalItems || 0}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </LinearGradient>

            <View style={[styles.statCard, styles.statCardDark]}>
              <MaterialIcons name="pending-actions" size={32} color={theme.colors.warning} />
              <Text style={styles.statValue}>{stats?.pendingItems || 0}</Text>
              <Text style={styles.statLabel}>Pending Items</Text>
            </View>

            <View style={[styles.statCard, styles.statCardDark]}>
              <MaterialIcons name="local-shipping" size={32} color={theme.colors.info} />
              <Text style={styles.statValue}>{stats?.totalPickups || 0}</Text>
              <Text style={styles.statLabel}>Total Pickups</Text>
            </View>

            <View style={[styles.statCard, styles.statCardDark]}>
              <MaterialIcons name="check-circle" size={32} color={theme.colors.success} />
              <Text style={styles.statValue}>{stats?.collectedItems || 0}</Text>
              <Text style={styles.statLabel}>Collected</Text>
            </View>

            <View style={[styles.statCard, styles.statCardDark]}>
              <MaterialIcons name="people" size={32} color={theme.colors.primary} />
              <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>

            <View style={[styles.statCard, styles.statCardDark]}>
              <MaterialIcons name="stars" size={32} color={theme.colors.gold} />
              <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Points Given</Text>
            </View>
          </View>
        </View>

        {/* Pending Pickups */}
        {stats?.pendingPickups > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="warning" size={24} color={theme.colors.warning} />
              <Text style={styles.sectionTitle}>
                {stats.pendingPickups} Pending Pickups
              </Text>
            </View>
            {recentPickups
              .filter(p => p.status === 'pending')
              .slice(0, 3)
              .map((pickup) => (
                <View key={pickup.id} style={styles.pickupCard}>
                  <View style={styles.pickupHeader}>
                    <MaterialIcons 
                      name={pickup.pickup_type === 'home_pickup' ? 'home' : 'location-on'} 
                      size={20} 
                      color={theme.colors.primary} 
                    />
                    <Text style={styles.pickupUser}>
                      {(pickup as any).user_profiles?.email?.split('@')[0] || 'User'}
                    </Text>
                  </View>
                  <View style={styles.pickupRow}>
                    <MaterialIcons name="calendar-today" size={16} color={theme.colors.textMuted} />
                    <Text style={styles.pickupText}>
                      {new Date(pickup.scheduled_date).toLocaleDateString()} • {pickup.scheduled_time}
                    </Text>
                  </View>
                  {pickup.address && (
                    <View style={styles.pickupRow}>
                      <MaterialIcons name="place" size={16} color={theme.colors.textMuted} />
                      <Text style={styles.pickupText} numberOfLines={1}>{pickup.address}</Text>
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Recent Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent E-waste Items</Text>
          {recentItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <MaterialIcons name="devices" size={20} color={theme.colors.primary} />
                <Text style={styles.itemType}>
                  {item.device_type} × {item.quantity}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + '20' },
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) },
                  ]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemUser}>
                By: {(item as any).user_profiles?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.itemPoints}>
                {item.points_earned} points • {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>

        {/* System Info */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={24} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Admin Access</Text>
            <Text style={styles.infoText}>
              You have full access to manage all e-waste items, pickups, and user data. Use the tabs below to navigate different sections.
            </Text>
          </View>
        </View>

        <View style={{ height: theme.spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: theme.colors.warning,
    scheduled: theme.colors.info,
    collected: theme.colors.success,
    processed: theme.colors.primary,
    in_progress: theme.colors.info,
    completed: theme.colors.success,
    cancelled: theme.colors.error,
  };
  return colors[status] || theme.colors.textMuted;
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
  greeting: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  username: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  adminBadge: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    width: '47.5%',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    ...theme.shadow.md,
  },
  statCardDark: {
    backgroundColor: theme.colors.surface,
  },
  statValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pickupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pickupUser: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  pickupText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  itemType: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  itemUser: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  itemPoints: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  infoCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  infoTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});