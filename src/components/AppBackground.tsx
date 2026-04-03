import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function AppBackground() {
  return (
    <>
      <LinearGradient
        colors={[colors.background, '#0e2b52', colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1 }}>
        <FontAwesome5 name="swimmer" size={280} color={colors.primary} />
      </View>
    </>
  );
}
