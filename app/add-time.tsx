import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppBackground from '../src/components/AppBackground';
import { t } from '../src/i18n';
import { dateToUI } from '../src/services/dateUtils';
import { Distance, Meet, PoolLength, Stroke, Swimmer, addPerformance, loadData, loadMeets, saveData } from '../src/services/storage';
import { colors } from '../src/theme/colors';
import { globalStyles } from '../src/theme/styles';

const ALL_STROKES: Stroke[] = ['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'medley'];
const ALL_DISTANCES: Distance[] = [50, 100, 200, 400, 800, 1500];

export default function AddTimeModal() {
  const router = useRouter();
  const { swimmerId } = useLocalSearchParams<{ swimmerId: string }>();
  const [swimmer, setSwimmer] = useState<Swimmer | null>(null);
  const [meets, setMeets] = useState<Meet[]>([]);

  // The date here serves as fallback or default, normally Meet takes precedence.
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeetId, setSelectedMeetId] = useState<string>('');
  const [stroke, setStroke] = useState<Stroke>('freestyle');
  const [distance, setDistance] = useState<Distance>(50);
  const [poolLength, setPoolLength] = useState<PoolLength>(25);

  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [hundredths, setHundredths] = useState('');

  const minRef = useRef<TextInput>(null);
  const secRef = useRef<TextInput>(null);
  const hunRef = useRef<TextInput>(null);

  const sortedMeets = useMemo(() => {
    return [...meets].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [meets]);

  useEffect(() => {
    Promise.all([loadData(), loadMeets()]).then(([swimmersData, meetsData]) => {
      const s = swimmersData.find(x => x.id === swimmerId);
      if (s) setSwimmer(s);

      meetsData.sort((a, b) => b.startDate.localeCompare(a.startDate));
      setMeets(meetsData);

      // Auto-select the most recent meet
      if (meetsData.length > 0 && !selectedMeetId) {
        setSelectedMeetId(meetsData[0].id);
      }
    });
  }, [swimmerId]);

  const handleSave = async () => {
    if (!selectedMeetId) return Alert.alert(t('common.error'), t('addTime.errorMeetSelect'));

    const m = parseInt(minutes || '0', 10);
    const s = parseInt(seconds || '0', 10);
    const h = parseInt(hundredths || '0', 10);

    const ms = (m * 60 * 1000) + (s * 1000) + (h * 10);
    if (ms === 0 || isNaN(ms)) return Alert.alert(t('common.error'), t('addTime.errorTime'));

    const data = await loadData();
    const updated = addPerformance(data, swimmerId!, {
      meetId: selectedMeetId,
      date, // We save the fallback date or we could retrieve the meetup date.
      stroke,
      distance,
      poolLength,
      timeMs: ms
    });

    await saveData(updated);
    router.back();
  };

  const hasTime = parseInt(minutes || '0', 10) > 0 || parseInt(seconds || '0', 10) > 0 || parseInt(hundredths || '0', 10) > 0;

  const onChangeMinutes = (text: string) => {
    const val = text.replace(/[^0-9]/g, '');
    setMinutes(val);
    if (val.length === 2) {
      secRef.current?.focus();
    }
  };

  const onChangeSeconds = (text: string) => {
    const val = text.replace(/[^0-9]/g, '');
    setSeconds(val);
    if (val.length === 2) {
      hunRef.current?.focus();
    }
  };

  const onChangeHundredths = (text: string) => {
    const val = text.replace(/[^0-9]/g, '');
    setHundredths(val);
  };

  if (!swimmer) return (
    <View style={globalStyles.page}>
      <AppBackground />
    </View>
  );

  return (
    <View style={globalStyles.page}>
      <AppBackground />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={globalStyles.text__heading2}>{t('addTime.swimmer', { name: swimmer.name })}</Text>

        <Text style={[globalStyles.text__body, { marginBottom: 8 }]}>{t('addTime.meet')}</Text>
        {meets.length === 0 ? (
          <Text style={[globalStyles.text__caption, { marginBottom: 16 }]}>{t('addTime.emptyMeets')}</Text>
        ) : (
          <Picker
            selectedValue={selectedMeetId}
            onValueChange={(itemValue) => setSelectedMeetId(itemValue)}
            style={[globalStyles.input, { outlineStyle: 'none', width: '100%', color: colors.textPrimary, height: 50, padding: 0, paddingHorizontal: 16 } as any]}
            dropdownIconColor={colors.primary}
          >
            {sortedMeets.map(m => (
              <Picker.Item key={m.id} label={`${m.name} - ${dateToUI(m.startDate)}`} value={m.id} color={colors.textPrimary} />
            ))}
          </Picker>
        )}

        <Text style={[globalStyles.text__body, { marginBottom: 8 }]}>{t('addTime.timeFormat')}</Text>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <TextInput
            ref={minRef}
            style={[globalStyles.input, { width: 60, textAlign: 'center', marginBottom: 0 }]}
            placeholder="mm"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
            value={minutes}
            onChangeText={onChangeMinutes}
          />
          <Text style={[globalStyles.text__heading2, { marginBottom: 0 }]}>:</Text>
          <TextInput
            ref={secRef}
            style={[globalStyles.input, { width: 60, textAlign: 'center', marginBottom: 0 }]}
            placeholder="ss"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
            value={seconds}
            onChangeText={onChangeSeconds}
          />
          <Text style={[globalStyles.text__heading2, { marginBottom: 0 }]}>.</Text>
          <TextInput
            ref={hunRef}
            style={[globalStyles.input, { width: 60, textAlign: 'center', marginBottom: 0 }]}
            placeholder="cc"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
            value={hundredths}
            onChangeText={onChangeHundredths}
          />
        </View>

        <Text style={[globalStyles.text__body, { marginBottom: 8 }]}>{t('addTime.stroke')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {ALL_STROKES.map(s => (
            <TouchableOpacity
              key={s}
              style={[globalStyles.button, stroke !== s && globalStyles['button--secondary'], globalStyles['button--sm'], { paddingHorizontal: 9 }]}
              onPress={() => setStroke(s)}
            >
              <Text style={[globalStyles.button__text, stroke !== s && globalStyles['button__text--secondary']]}>
                {t(`strokesShort.${s}` as any)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[globalStyles.text__body, { marginBottom: 8 }]}>{t('addTime.distance')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {ALL_DISTANCES.map(d => (
            <TouchableOpacity
              key={d}
              style={[globalStyles.button, distance !== d && globalStyles['button--secondary'], globalStyles['button--sm']]}
              onPress={() => setDistance(d)}
            >
              <Text style={[globalStyles.button__text, distance !== d && globalStyles['button__text--secondary']]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[globalStyles.text__body, { marginBottom: 8 }]}>{t('addTime.poolLength')}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 30 }}>
          {[25, 50].map(p => (
            <TouchableOpacity
              key={p}
              style={[globalStyles.button, poolLength !== p && globalStyles['button--secondary'], globalStyles['button--md']]}
              onPress={() => setPoolLength(p as PoolLength)}
            >
              <Text style={[globalStyles.button__text, poolLength !== p && globalStyles['button__text--secondary']]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[globalStyles.button, !hasTime && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!hasTime}
        >
          <Text style={globalStyles.button__text}>{t('common.save')}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
