// Hook to consume E-waste context
import { useContext } from 'react';
import { EwasteContext } from '@/contexts/EwasteContext';

export function useEwaste() {
  const context = useContext(EwasteContext);
  if (!context) {
    throw new Error('useEwaste must be used within EwasteProvider');
  }
  return context;
}