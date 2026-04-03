import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { t } from '../../src/i18n';
import { useSync } from '../../src/context/SyncContext';

export default function TabLayout() {
  const { openSyncMenu } = useSync();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 16, padding: 8 }}
            onPress={() => openSyncMenu()}
          >
            <FontAwesome name="bars" size={20} color={colors.primary} />
          </TouchableOpacity>
        ),
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: 5, height: 60 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.swimmers'),
          tabBarIcon: ({ color }) => <FontAwesome name="group" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: t('tabs.records'),
          tabBarIcon: ({ color }) => <FontAwesome name="trophy" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meets"
        options={{
          title: t('tabs.meets'),
          tabBarIcon: ({ color }) => <FontAwesome name="calendar" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
