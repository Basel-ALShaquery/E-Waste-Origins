// Admin items management screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { ewasteService } from '@/services/ewasteService';
import { useAlert } from '@/template';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: theme.colors.warning },
  { value: 'scheduled', label: 'Scheduled', color: theme.colors.info },
  { value: 'collected', label: 'Collected', color: theme.colors.success },
  { value: 'processed', label: 'Processed', color: theme.colors.primary },
];

export default function AdminItemsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const { data } = await ewasteService.getAllEwasteItems();
    if (data) setItems(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    const { error } = await ewasteService.updateEwasteItemStatus(itemId, newStatus);
    if (error) {
      showAlert('Error', error);
      return;
    }
    showAlert('Success', 'Item status updated');
    loadItems();
  };

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.status === filter);

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
            <Text style={styles.title}>E-waste Items</Text>
            <Text style={styles.subtitle}>{items.length} total items</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <Pressable
              style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All ({items.length})
              </Text>
            </Pressable>
            {STATUS_OPTIONS.map((status) => {
              const count = items.filter(i => i.status === status.value).length;
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
                  <Text style={[
                    styles.filterText,
                    filter === status.value && styles.filterTextActive,
                  ]}>
                    {status.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Items List */}
        <View style={styles.section}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <MaterialIcons name="devices" size={24} color={theme.colors.primary} />
                <View style={styles.itemTitleSection}>
                  <Text style={styles.itemType}>
                    {item.device_type} × {item.quantity}
                  </Text>
                  <Text style={styles.itemUser}>
                    By: {(item as any).user_profiles?.email?.split('@')[0] || 'User'}
                  </Text>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.itemRow}>
                  <MaterialIcons name="build" size={16} color={theme.colors.textMuted} />
                  <Text style={styles.itemDetailText}>Condition: {item.condition.replace('_', ' ')}</Text>
                </View>
                <View style={styles.itemRow}>
                  <MaterialIcons name="stars" size={16} color={theme.colors.gold} />
                  <Text style={styles.itemDetailText}>{item.points_earned} points</Text>
                </View>
                <View style={styles.itemRow}>
                  <MaterialIcons name="calendar-today" size={16} color={theme.colors.textMuted} />
                  <Text style={styles.itemDetailText}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {item.description && (
                <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
              )}

              {/* Status Update */}
              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>Status:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.statusButtons}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <Pressable
                      key={status.value}
                      style={[
                        styles.statusButton,
                        item.status === status.value && styles.statusButtonActive,
                        item.status === status.value && { backgroundColor: status.color + '20', borderColor: status.color },
                      ]}
                      onPress={() => updateItemStatus(item.id, status.value)}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        item.status === status.value && { color: status.color },
                      ]}>
                        {status.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          ))}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="inventory" size={64} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No items in this category</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.text,
  },
  section: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  itemTitleSection: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  itemType: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  itemUser: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  itemDetails: {
    gap: theme.spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  itemDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  itemDescription: {
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
    gap: theme.spacing.sm,
  },
  statusButton: {
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
    fontSize: theme.fontSize.sm,
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
  },
});