import { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import SyncMenu from '../src/components/SyncMenu';
import { useState } from 'react';
import 'react-native-reanimated';
import { colors } from '../src/theme/colors';
import { t } from '../src/i18n';
import { loadData, saveData, saveMeets } from '../src/services/storage';
import { SyncProvider, useSync } from '../src/context/SyncContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function RootLayout() {
  return (
    <SyncProvider>
      <RootLayoutContent />
    </SyncProvider>
  );
}

function RootLayoutContent() {
  const { isSyncMenuOpen, openSyncMenu, closeSyncMenu } = useSync();

  useEffect(() => {
    const seedDatabase = async () => {
      try {
        const existingData = await loadData();
        if (existingData.length === 0) {
          console.log("Empty DB detected: Seeding with initialData.json");
          const initialData = require('../src/data/initialData.json');
          await saveMeets(initialData.meets);
          await saveData(initialData.swimmers);
        }
      } catch (e) {
        console.error("Seeding failed", e);
      }
    };
    seedDatabase();
  }, []);

  const headerRight = () => (
    <TouchableOpacity 
      style={{ marginRight: 16, padding: 8 }}
      onPress={() => openSyncMenu()}
    >
      <FontAwesome name="bars" size={20} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <ThemeProvider value={CustomDarkTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="add-time" 
          options={{ 
            presentation: 'modal', 
            title: t('addTime.title'),
            headerRight: headerRight,
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
      
      <SyncMenu 
        isVisible={isSyncMenuOpen} 
        onClose={() => closeSyncMenu()} 
      />
    </ThemeProvider>
  );
}
