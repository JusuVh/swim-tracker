import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Pressable } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { globalStyles } from '../../src/theme/styles';
import { Swimmer, loadData, saveData, addSwimmer, removeSwimmer } from '../../src/services/storage';
import { dateToISO, dateToUI } from '../../src/services/dateUtils';
import AppBackground from '../../src/components/AppBackground';
import { t } from '../../src/i18n';

export default function SwimmersScreen() {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [newSwimmerName, setNewSwimmerName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const fetchSwimmers = useCallback(async () => {
    const data = await loadData();
    setSwimmers(data);
  }, []);

  const handleGenerateTest = async () => {
    const data = await loadData();
    if (data.find(s => s.name === 'Test')) {
       Alert.alert('Info', 'Test existe déjà');
       return;
    }
    
    const eliot = data.find(s => s.name === 'Eliot');
    if (!eliot) {
       Alert.alert('Erreur', 'Eliot introuvable');
       return;
    }

    const testSwimmer: Swimmer = {
      id: Date.now().toString() + '_test',
      name: 'Test',
      performances: eliot.performances.map(p => ({
        ...p,
        id: Math.random().toString(),
        // Variation +/- 1000ms (1 seconde)
        timeMs: Math.max(100, p.timeMs + (Math.floor(Math.random() * 2000) - 1000))
      }))
    };
    
    const updated = [...data, testSwimmer];
    await saveData(updated);
    fetchSwimmers();
  };

  useFocusEffect(
    useCallback(() => {
      fetchSwimmers();
    }, [fetchSwimmers])
  );

  const handleAddSwimmer = async () => {
    if (!newSwimmerName.trim()) return;
    const updated = addSwimmer(swimmers, newSwimmerName.trim());
    setSwimmers(updated);
    setNewSwimmerName('');
    await saveData(updated);
  };

  const handleRemoveSwimmer = async (id: string) => {
    const data = await loadData();
    const updated = removeSwimmer(data, id);
    setSwimmers(updated);
    await saveData(updated);
    setConfirmDeleteId(null);
  };

  const renderSwimmer = ({ item }: { item: Swimmer }) => (
    <View style={[globalStyles.card, globalStyles['card--data']]}>
      <Pressable 
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        onPress={() => router.push({ pathname: '/records', params: { swimmerId: item.id } })}
      >
        <View style={{ flex: 1 }}>
          <Text style={globalStyles.card__title}>{item.name}</Text>
          <Text style={globalStyles.text__caption}>{item.performances.length} {t('swimmers.performanceCount')}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            style={[globalStyles.button, { width: 40, height: 40, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' }]}
            onPress={() => {
              setConfirmDeleteId(null);
              router.push({ pathname: '/add-time', params: { swimmerId: item.id } });
            }}
          >
            <FontAwesome name="plus" size={16} color={colors.background} />
          </TouchableOpacity>
          {confirmDeleteId === item.id ? (
            <TouchableOpacity 
              style={[globalStyles.button, { backgroundColor: '#B71C1C', width: 40, height: 40, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' }]}
              onPress={() => handleRemoveSwimmer(item.id)}
            >
              <FontAwesome name="check" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[globalStyles.button, { backgroundColor: colors.error, width: 40, height: 40, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' }]}
              onPress={() => setConfirmDeleteId(item.id)}
            >
              <FontAwesome name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={globalStyles.page}>
      <AppBackground />
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <TextInput
            style={[globalStyles.input, { flex: 1, marginBottom: 0 }]}
            placeholder={t('swimmers.newSwimmer')}
            placeholderTextColor={colors.textSecondary}
            value={newSwimmerName}
            onChangeText={setNewSwimmerName}
          />
          <TouchableOpacity style={globalStyles.button} onPress={handleAddSwimmer}>
            <Text style={globalStyles.button__text}>{t('common.add')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[globalStyles.button, globalStyles['button--secondary']]} onPress={handleGenerateTest}>
          <Text style={[globalStyles.button__text, globalStyles['button__text--secondary']]}>+ {t('common.add')} Test</Text>
        </TouchableOpacity>
      </View>

      {swimmers.length === 0 ? (
        <View style={globalStyles['page--centered']}>
          <FontAwesome name="info-circle" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={globalStyles.text__body}>{t('swimmers.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={swimmers}
          keyExtractor={(item) => item.id}
          renderItem={renderSwimmer}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
