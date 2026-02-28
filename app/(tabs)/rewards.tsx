// Rewards and achievements screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useEwaste } from '@/hooks/useEwaste';
import { LinearGradient } from 'expo-linear-gradient';
import { ewasteService } from '@/services/ewasteService';

const ACHIEVEMENTS = [
  { id: 'First Contributor', icon: 'star', color: theme.colors.gold, requirement: 1 },
  { id: 'Eco Warrior', icon: 'eco', color: theme.colors.success, requirement: 10 },
  { id: 'Recycling Champion', icon: 'emoji-events', color: theme.colors.primary, requirement: 50 },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { userRewards, refreshData } = useEwaste();
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data } = await ewasteService.getLeaderboard();
    if (data) setLeaderboard(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadLeaderboard();
    setRefreshing(false);
  };

  const userCertificates = userRewards?.certificates || [];
  const totalPoints = userRewards?.total_points || 0;
  const totalItems = userRewards?.total_items_contributed || 0;

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
          <Text style={styles.title}>Rewards</Text>
          <Text style={styles.subtitle}>Your achievements and points</Text>
        </View>

        {/* Points Card */}
        <View style={styles.section}>
          <LinearGradient
            colors={[theme.colors.gold, theme.colors.warning]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pointsCard}
          >
            <MaterialIcons name="stars" size={64} color="#FFFFFF" />
            <Text style={styles.pointsValue}>{totalPoints}</Text>
            <Text style={styles.pointsLabel}>Total Points Earned</Text>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialIcons name="recycling" size={32} color={theme.colors.success} />
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Items Recycled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="emoji-events" size={32} color={theme.colors.gold} />
            <Text style={styles.statValue}>{userCertificates.length}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = userCertificates.includes(achievement.id);
            const progress = Math.min((totalItems / achievement.requirement) * 100, 100);

            return (
              <View key={achievement.id} style={styles.achievementCard}>
                <View style={[
                  styles.achievementIcon,
                  { backgroundColor: unlocked ? achievement.color + '20' : theme.colors.surface },
                ]}>
                  <MaterialIcons 
                    name={achievement.icon as any} 
                    size={32} 
                    color={unlocked ? achievement.color : theme.colors.textMuted} 
                  />
                </View>

                <View style={styles.achievementContent}>
                  <View style={styles.achievementHeader}>
                    <Text style={[
                      styles.achievementTitle,
                      !unlocked && styles.achievementTitleLocked,
                    ]}>
                      {achievement.id}
                    </Text>
                    {unlocked && (
                      <MaterialIcons name="check-circle" size={20} color={achievement.color} />
                    )}
                  </View>

                  <Text style={styles.achievementRequirement}>
                    {unlocked 
                      ? `Unlocked! Contributed ${achievement.requirement}+ items`
                      : `Contribute ${achievement.requirement} items to unlock`
                    }
                  </Text>

                  {!unlocked && (
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <View 
                          style={[
                            styles.progressBarFill,
                            { width: `${progress}%`, backgroundColor: achievement.color },
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {totalItems}/{achievement.requirement}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Leaderboard */}
        <View style={styles.section}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <MaterialIcons name="leaderboard" size={24} color={theme.colors.primary} />
          </View>

          {leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => {
              const medalColors = [theme.colors.gold, theme.colors.silver, theme.colors.bronze];
              const medalColor = medalColors[index] || theme.colors.textMuted;

              return (
                <View key={entry.id} style={styles.leaderboardCard}>
                  <View style={styles.leaderboardRank}>
                    {index < 3 ? (
                      <MaterialIcons name="emoji-events" size={24} color={medalColor} />
                    ) : (
                      <Text style={styles.rankNumber}>#{index + 1}</Text>
                    )}
                  </View>

                  <View style={styles.leaderboardContent}>
                    <Text style={styles.leaderboardName}>
                      {(entry as any).user_profiles?.username || (entry as any).user_profiles?.email?.split('@')[0] || 'User'}
                    </Text>
                    <View style={styles.leaderboardStats}>
                      <MaterialIcons name="recycling" size={14} color={theme.colors.textMuted} />
                      <Text style={styles.leaderboardText}>
                        {entry.total_items_contributed} items
                      </Text>
                    </View>
                  </View>

                  <View style={styles.leaderboardPoints}>
                    <Text style={styles.leaderboardPointsValue}>{entry.total_points}</Text>
                    <Text style={styles.leaderboardPointsLabel}>pts</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyLeaderboard}>
              <MaterialIcons name="emoji-events" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No rankings yet</Text>
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
  pointsCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadow.lg,
  },
  pointsValue: {
    fontSize: 56,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  pointsLabel: {
    fontSize: theme.fontSize.lg,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  achievementTitleLocked: {
    color: theme.colors.textMuted,
  },
  achievementRequirement: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.medium,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  leaderboardContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  leaderboardName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  leaderboardText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  leaderboardPoints: {
    alignItems: 'flex-end',
  },
  leaderboardPointsValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gold,
  },
  leaderboardPointsLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
  emptyLeaderboard: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
});