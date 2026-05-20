import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  dark?: boolean;
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, dark = false, intensity = 1 }) => {
  const cardStyle = [
    styles.card,
    dark ? styles.darkCard : styles.lightCard,
    style
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
      default: {}
    }),
  },
  lightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: 'rgba(31, 38, 135, 0.06)',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.15,
  },
  darkCard: {
    backgroundColor: 'rgba(22, 28, 45, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.3,
  }
});
export default GlassCard;
