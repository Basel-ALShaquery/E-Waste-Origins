// E-waste management service
import { getSupabaseClient } from '@/template';

export interface EwasteItem {
  id: string;
  user_id: string;
  device_type: string;
  quantity: number;
  condition: string;
  description?: string;
  photo_url?: string;
  status: 'pending' | 'scheduled' | 'collected' | 'processed';
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface Pickup {
  id: string;
  user_id: string;
  ewaste_item_id?: string;
  pickup_type: 'home_pickup' | 'drop_off';
  scheduled_date: string;
  scheduled_time: string;
  address?: string;
  phone?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  total_points: number;
  total_items_contributed: number;
  rank: number;
  certificates: string[];
  created_at: string;
  updated_at: string;
}

export interface DropOffLocation {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

const supabase = getSupabaseClient();

// Device type points mapping
const DEVICE_POINTS: Record<string, number> = {
  phone: 10,
  laptop: 25,
  tablet: 15,
  monitor: 20,
  keyboard: 5,
  mouse: 3,
  cables: 2,
  pcb: 30,
  other: 5,
};

// Helper function to safely extract error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'Unknown error occurred';
};

export const ewasteService = {
  // E-waste items
  async createEwasteItem(data: {
    device_type: string;
    quantity: number;
    condition: string;
    description?: string;
    photo_url?: string;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'Not authenticated' };

      const points = (DEVICE_POINTS[data.device_type.toLowerCase()] || DEVICE_POINTS.other) * data.quantity;

      const { data: item, error } = await supabase
        .from('ewaste_items')
        .insert({
          user_id: user.id,
          ...data,
          points_earned: points,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: item, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  async getUserEwasteItems() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('ewaste_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  async getAllEwasteItems() {
    try {
      const { data, error } = await supabase
        .from('ewaste_items')
        .select(`
          *,
          user_profiles (username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  async updateEwasteItemStatus(itemId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('ewaste_items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // Pickups
  async schedulePickup(data: {
    ewaste_item_id?: string;
    pickup_type: 'home_pickup' | 'drop_off';
    scheduled_date: string;
    scheduled_time: string;
    address?: string;
    phone?: string;
    notes?: string;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'Not authenticated' };

      const { data: pickup, error } = await supabase
        .from('pickups')
        .insert({
          user_id: user.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;

      // Update ewaste item status if linked
      if (pickup && data.ewaste_item_id) {
        await supabase
          .from('ewaste_items')
          .update({ status: 'scheduled' })
          .eq('id', data.ewaste_item_id);
      }

      return { data: pickup, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  async getUserPickups() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('pickups')
        .select(`
          *,
          ewaste_items (device_type, quantity, condition)
        `)
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  async getAllPickups() {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .select(`
          *,
          user_profiles (username, email),
          ewaste_items (device_type, quantity, condition)
        `)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  async updatePickupStatus(pickupId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('pickups')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', pickupId)
        .select()
        .single();

      if (error) throw error;

      // If completed, update linked ewaste item
      if (data && status === 'completed' && data.ewaste_item_id) {
        await supabase
          .from('ewaste_items')
          .update({ status: 'collected' })
          .eq('id', data.ewaste_item_id);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // Rewards
  async getUserRewards(userId?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      if (!targetUserId) return { data: null, error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error && error.code === 'PGRST116') { // No rows found
        const { data: newReward, error: createError } = await supabase
          .from('user_rewards')
          .insert({ user_id: targetUserId })
          .select()
          .single();
        
        if (createError) throw createError;
        return { data: newReward, error: null };
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  async updateUserRewards(userId: string, pointsToAdd: number, itemsToAdd: number) {
    try {
      const { data: current, error: fetchError } = await this.getUserRewards(userId);
      if (fetchError) throw new Error(fetchError);
      
      const newPoints = (current?.total_points || 0) + pointsToAdd;
      const newItems = (current?.total_items_contributed || 0) + itemsToAdd;

      // Calculate certificates
      const certificates: string[] = current?.certificates || [];
      if (newItems >= 1 && !certificates.includes('First Contributor')) {
        certificates.push('First Contributor');
      }
      if (newItems >= 10 && !certificates.includes('Eco Warrior')) {
        certificates.push('Eco Warrior');
      }
      if (newItems >= 50 && !certificates.includes('Recycling Champion')) {
        certificates.push('Recycling Champion');
      }

      const { data, error } = await supabase
        .from('user_rewards')
        .upsert({
          user_id: userId,
          total_points: newPoints,
          total_items_contributed: newItems,
          certificates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  async getLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('user_rewards')
        .select(`
          *,
          user_profiles (username, email)
        `)
        .order('total_points', { ascending: false })
        .limit(10);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // Drop-off locations
  async getDropOffLocations() {
    try {
      const { data, error } = await supabase
        .from('drop_off_locations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },

  // Admin check
  async isAdmin(userId?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      if (!targetUserId) return false;

      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', targetUserId)
        .single();

      if (error && error.code === 'PGRST116') return false;
      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking admin:', getErrorMessage(error));
      return false;
    }
  },

  // Admin stats
  async getAdminStats() {
    try {
      const [itemsRes, pickupsRes, usersRes] = await Promise.all([
        supabase.from('ewaste_items').select('status', { count: 'exact', head: false }),
        supabase.from('pickups').select('status', { count: 'exact', head: false }),
        supabase.from('user_rewards').select('total_points', { count: 'exact', head: false }),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (pickupsRes.error) throw pickupsRes.error;
      if (usersRes.error) throw usersRes.error;

      const stats = {
        totalItems: itemsRes.count || 0,
        pendingItems: itemsRes.data?.filter(i => i.status === 'pending').length || 0,
        collectedItems: itemsRes.data?.filter(i => i.status === 'collected').length || 0,
        totalPickups: pickupsRes.count || 0,
        pendingPickups: pickupsRes.data?.filter(p => p.status === 'pending').length || 0,
        totalUsers: usersRes.count || 0,
        totalPoints: usersRes.data?.reduce((sum, r) => sum + (r.total_points || 0), 0) || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },
};