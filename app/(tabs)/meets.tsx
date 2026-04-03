import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { globalStyles } from '../../src/theme/styles';
import { Meet, loadMeets, loadData, saveMeets, addMeet, removeMeet, updateMeet } from '../../src/services/storage';
import { dateToISO, dateToUI, getTodayUI } from '../../src/services/dateUtils';
import { t } from '../../src/i18n';
import AppBackground from '../../src/components/AppBackground';

export default function MeetsScreen() {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [newMeetName, setNewMeetName] = useState('');
  const [newMeetStartDate, setNewMeetStartDate] = useState(getTodayUI());
  const [newMeetEndDate, setNewMeetEndDate] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchMeets = useCallback(async () => {
    const data = await loadMeets();
    setMeets(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMeets();
    }, [fetchMeets])
  );

  const sortedMeets = useMemo(() => {
    return [...meets].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [meets]);

  const handleAddMeet = async () => {
    if (!newMeetName.trim() || !newMeetStartDate.trim()) {
      return Alert.alert(t('common.error'), t('meets.errorNameDate'));
    }
    const isoStart = dateToISO(newMeetStartDate.trim());
    const isoEnd = newMeetEndDate.trim() ? dateToISO(newMeetEndDate.trim()) : undefined;

    if (!isoStart || (newMeetEndDate.trim() && !isoEnd)) {
      return Alert.alert(t('common.error'), t('meets.errorDate'));
    }

    const updated = addMeet(meets, {
      name: newMeetName.trim(),
      startDate: isoStart,
      endDate: isoEnd,
    });
    setMeets(updated);
    setNewMeetName('');
    setNewMeetStartDate(getTodayUI());
    setNewMeetEndDate('');
    await saveMeets(updated);
  };

  const handleRemoveMeet = async (id: string) => {
    // Check if any performance is linked to this meet
    const swimmers = await loadData();
    const hasLinked = swimmers.some(s => s.performances.some(p => p.meetId === id));
    if (hasLinked) {
      setConfirmDeleteId(null);
      // On web, fallback to alert for info-only messages (no buttons array)
      Alert.alert(
        'Impossible de supprimer',
        'Des temps sont rattachés à cette compétition. Supprimez-les d’abord dans l’onglet Records.'
      );
      return;
    }
    const updated = removeMeet(meets, id);
    setMeets(updated);
    await saveMeets(updated);
    setEditingId(null);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    const updated = updateMeet(meets, id, editName.trim());
    setMeets(updated);
    await saveMeets(updated);
    setEditingId(null);
  };

  const startEdit = (meet: Meet) => {
    setEditName(meet.name);
    setEditingId(meet.id);
  };

  const renderMeet = ({ item }: { item: Meet }) => (
    <View style={[globalStyles.card, globalStyles['card--data']]}>
      {editingId === item.id ? (
        // ── Inline edit mode ──
        <View>
          <Text style={[globalStyles.text__caption, { marginBottom: 8 }]}>
            {dateToUI(item.startDate)}{item.endDate ? ` - ${dateToUI(item.endDate)}` : ''}
          </Text>
          <TextInput
            style={[globalStyles.input, { marginBottom: 10 }]}
            value={editName}
            onChangeText={setEditName}
            autoFocus
            placeholderTextColor={colors.textSecondary}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[globalStyles.button, globalStyles['button--sm'], { flex: 1 }]}
              onPress={() => handleSaveEdit(item.id)}
            >
              <Text style={globalStyles.button__text}>✓ Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[globalStyles.button, globalStyles['button--secondary'], globalStyles['button--sm']]}
              onPress={() => { setEditingId(null); setConfirmDeleteId(null); }}
            >
              <Text style={[globalStyles.button__text, globalStyles['button__text--secondary']]}>Annuler</Text>
            </TouchableOpacity>
            {confirmDeleteId === item.id ? (
              <TouchableOpacity
                style={[globalStyles.button, { backgroundColor: '#B71C1C', width: 40, height: 40, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' }]}
                onPress={() => handleRemoveMeet(item.id)}
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
        </View>
      ) : (
        // ── Normal display mode ──
        <TouchableOpacity onPress={() => startEdit(item)} activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={globalStyles.card__title}>{item.name}</Text>
              <Text style={globalStyles.text__caption}>
                {dateToUI(item.startDate)} {item.endDate ? `- ${dateToUI(item.endDate)}` : ''}
              </Text>
            </View>
            <FontAwesome name="pencil" size={14} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={globalStyles.page}>
      <AppBackground />
      
      <View style={globalStyles.card}>
        <Text style={[globalStyles.text__heading2, { marginBottom: 16 }]}>{t('meets.newMeet')}</Text>
        
        <TextInput
          style={globalStyles.input}
          placeholder={t('meets.namePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={newMeetName}
          onChangeText={setNewMeetName}
        />
        
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={[globalStyles.text__caption, { marginBottom: 4 }]}>{t('meets.start')}</Text>
            <TextInput
              style={globalStyles.input}
              placeholder={t('meets.formatHelp')}
              placeholderTextColor={colors.textSecondary}
              value={newMeetStartDate}
              onChangeText={setNewMeetStartDate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[globalStyles.text__caption, { marginBottom: 4 }]}>{t('meets.endOptional')}</Text>
            <TextInput
              style={globalStyles.input}
              placeholder={t('meets.formatHelp')}
              placeholderTextColor={colors.textSecondary}
              value={newMeetEndDate}
              onChangeText={setNewMeetEndDate}
            />
          </View>
        </View>

        <TouchableOpacity style={globalStyles.button} onPress={handleAddMeet}>
          <Text style={globalStyles.button__text}>{t('meets.create')}</Text>
        </TouchableOpacity>
      </View>

      {meets.length === 0 ? (
        <View style={globalStyles['page--centered']}>
          <FontAwesome name="calendar" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
          <Text style={globalStyles.text__body}>{t('meets.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedMeets}
          keyExtractor={(item) => item.id}
          renderItem={renderMeet}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
