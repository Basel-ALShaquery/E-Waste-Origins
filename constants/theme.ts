// E-Waste Origins - Design System
// Matching logo gradient: teal-cyan-blue with circuit-board aesthetic

export const theme = {
  colors: {
    // Primary gradient (from logo)
    primary: '#00D4AA',      // Teal
    primaryLight: '#00E5D4',  // Cyan
    primaryDark: '#0099CC',   // Blue
    
    // Background
    background: '#0A0E1A',
    backgroundLight: '#131827',
    surface: '#1A2237',
    surfaceLight: '#232D47',
    
    // Text
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    
    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Rewards
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    
    // Border
    border: '#2D3748',
    borderLight: '#3F4A5F',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#00D4AA',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

export type Theme = typeof theme;