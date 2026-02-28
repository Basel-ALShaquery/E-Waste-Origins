// E-waste context for managing app-wide state
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/template';
import { ewasteService, EwasteItem, Pickup, UserReward } from '@/services/ewasteService';

interface EwasteContextType {
  isAdmin: boolean;
  userItems: EwasteItem[];
  userPickups: Pickup[];
  userRewards: UserReward | null;
  loading: boolean;
  refreshData: () => Promise<void>;
}

export const EwasteContext = createContext<EwasteContextType | undefined>(undefined);

export function EwasteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userItems, setUserItems] = useState<EwasteItem[]>([]);
  const [userPickups, setUserPickups] = useState<Pickup[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    if (!user) {
      setUserItems([]);
      setUserPickups([]);
      setUserRewards(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Check admin status
      const adminStatus = await ewasteService.isAdmin();
      setIsAdmin(adminStatus);

      // Load user data
      const [itemsRes, pickupsRes, rewardsRes] = await Promise.all([
        ewasteService.getUserEwasteItems(),
        ewasteService.getUserPickups(),
        ewasteService.getUserRewards(),
      ]);

      setUserItems(itemsRes.data || []);
      setUserPickups(pickupsRes.data || []);
      setUserRewards(rewardsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  return (
    <EwasteContext.Provider
      value={{
        isAdmin,
        userItems,
        userPickups,
        userRewards,
        loading,
        refreshData,
      }}
    >
      {children}
    </EwasteContext.Provider>
  );
}