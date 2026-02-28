// User home screen - Dashboard
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/template';
import { useEwaste } from '@/hooks/useEwaste';
import { theme } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { userItems, userPickups, userRewards, refreshData } = useEwaste();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const pendingItems = userItems.filter(item => item.status === 'pending').length;
  const pendingPickups = userPickups.filter(pickup => pickup.status === 'pending').length;

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
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <Image 
            source={require('@/assets/images/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <MaterialIcons name="devices" size={32} color="#FFFFFF" />
            <Text style={styles.statValue}>{userItems.length}</Text>
            <Text style={styles.statLabel}>Items Registered</Text>
          </LinearGradient>

          <View style={[styles.statCard, styles.statCardDark]}>
            <MaterialIcons name="local-shipping" size={32} color={theme.colors.primary} />
            <Text style={styles.statValue}>{userPickups.length}</Text>
            <Text style={styles.statLabel}>Total Pickups</Text>
          </View>

          <View style={[styles.statCard, styles.statCardDark]}>
            <MaterialIcons name="stars" size={32} color={theme.colors.gold} />
            <Text style={styles.statValue}>{userRewards?.total_points || 0}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>

          <View style={[styles.statCard, styles.statCardDark]}>
            <MaterialIcons name="eco" size={32} color={theme.colors.success} />
            <Text style={styles.statValue}>{userRewards?.total_items_contributed || 0}</Text>
            <Text style={styles.statLabel}>Items Recycled</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Pressable 
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/(tabs)/register')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <MaterialIcons name="add-circle-outline" size={28} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Register E-waste</Text>
              <Text style={styles.actionSubtitle}>Add new devices</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/(tabs)/pickups')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.info + '20' }]}>
                <MaterialIcons name="schedule" size={28} color={theme.colors.info} />
              </View>
              <Text style={styles.actionTitle}>Schedule Pickup</Text>
              <Text style={styles.actionSubtitle}>Book collection</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/(tabs)/rewards')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.gold + '20' }]}>
                <MaterialIcons name="card-giftcard" size={28} color={theme.colors.gold} />
              </View>
              <Text style={styles.actionTitle}>View Rewards</Text>
              <Text style={styles.actionSubtitle}>Check achievements</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push('/drop-off-locations')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '20' }]}>
                <MaterialIcons name="location-on" size={28} color={theme.colors.success} />
              </View>
              <Text style={styles.actionTitle}>Drop-off Points</Text>
              <Text style={styles.actionSubtitle}>Find locations</Text>
            </Pressable>
          </View>
        </View>

        {/* Pending Alerts */}
        {(pendingItems > 0 || pendingPickups > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Actions</Text>
            {pendingItems > 0 && (
              <Pressable 
                style={styles.alertCard}
                onPress={() => router.push('/(tabs)/pickups')}
              >
                <MaterialIcons name="info-outline" size={24} color={theme.colors.warning} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>
                    {pendingItems} item{pendingItems > 1 ? 's' : ''} waiting for pickup
                  </Text>
                  <Text style={styles.alertSubtitle}>Schedule a collection to proceed</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
              </Pressable>
            )}
            {pendingPickups > 0 && (
              <View style={styles.alertCard}>
                <MaterialIcons name="local-shipping" size={24} color={theme.colors.info} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>
                    {pendingPickups} pickup{pendingPickups > 1 ? 's' : ''} scheduled
                  </Text>
                  <Text style={styles.alertSubtitle}>Our team will contact you soon</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Impact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Environmental Impact</Text>
          <View style={styles.impactCard}>
            <LinearGradient
              colors={[theme.colors.success + '40', theme.colors.success + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.impactGradient}
            >
              <MaterialIcons name="eco" size={48} color={theme.colors.success} />
              <Text style={styles.impactTitle}>
                You've helped recycle {userRewards?.total_items_contributed || 0} electronic devices
              </Text>
              <Text style={styles.impactSubtitle}>
                Contributing to a cleaner environment and sustainable future
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Bottom Spacing */}
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
  headerLogo: {
    width: 50,
    height: 50,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
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
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  actionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  alertContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  alertTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  alertSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  impactCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  impactGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  impactTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  impactSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});