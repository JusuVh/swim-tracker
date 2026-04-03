import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { globalStyles } from '../../src/theme/styles';
import { Swimmer, Meet, Stroke, Distance, loadData, loadMeets, Performance, saveData, removePerformance, updatePerformance } from '../../src/services/storage';
import { formatTimeMS } from '../../src/services/timeUtils';
import { t } from '../../src/i18n';
import { dateToUI } from '../../src/services/dateUtils';
import AppBackground from '../../src/components/AppBackground';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryScatter, VictoryTheme, VictoryLabel } from 'victory-native';

const ALL_STROKES: Stroke[] = ['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'medley'];
const ALL_DISTANCES: Distance[] = [50, 100, 200, 400, 800, 1500];

type FilterDistance = Distance | 'all';
type FilterStroke = Stroke | 'all';
type ViewMode = 'history' | 'compare';

export default function RecordsScreen() {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [meets, setMeets] = useState<Meet[]>([]);
  const [selectedSwimmerId, setSelectedSwimmerId] = useState<string | null>(null);
  const { swimmerId } = useLocalSearchParams<{ swimmerId: string }>();

  const [mode, setMode] = useState<ViewMode>('history');
  
  const [filterDistance, setFilterDistance] = useState<FilterDistance>('all');
  const [filterStroke, setFilterStroke] = useState<FilterStroke>('all');
  
  const [compareDistance, setCompareDistance] = useState<Distance>(100);
  const [isChartVisible, setIsChartVisible] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editMin, setEditMin] = useState('');
  const [editSec, setEditSec] = useState('');
  const [editHun, setEditHun] = useState('');
  const editSecRef = useRef<TextInput>(null);
  const editHunRef = useRef<TextInput>(null);

  const startEdit = (perf: Performance) => {
    const totalSec = Math.floor(perf.timeMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const hun = Math.floor((perf.timeMs % 1000) / 10);
    setEditMin(min > 0 ? String(min) : '');
    setEditSec(String(sec).padStart(2, '0'));
    setEditHun(String(hun).padStart(2, '0'));
    setEditingId(perf.id);
  };

  const handleSaveEdit = async (swimmerId: string, performanceId: string) => {
    const m = parseInt(editMin || '0', 10);
    const s = parseInt(editSec || '0', 10);
    const h = parseInt(editHun || '0', 10);
    const newMs = (m * 60000) + (s * 1000) + (h * 10);
    if (newMs === 0) return Alert.alert('Erreur', 'Le temps ne peut pas être 0');
    const data = await loadData();
    const updated = updatePerformance(data, swimmerId, performanceId, newMs);
    await saveData(updated);
    setEditingId(null);
    fetchData();
  };

  const handleDelete = async (swimmerId: string, performanceId: string) => {
    const data = await loadData();
    const updated = removePerformance(data, swimmerId, performanceId);
    await saveData(updated);
    setEditingId(null);
    setConfirmDeleteId(null);
    fetchData();
  };

  const fetchData = useCallback(async () => {
    const [swimmersData, meetsData] = await Promise.all([loadData(), loadMeets()]);
    setSwimmers(swimmersData);
    setMeets(meetsData);
    
    // Initial default selection only if nothing is selected yet
    if (swimmersData.length > 0 && !selectedSwimmerId && !swimmerId) {
      setSelectedSwimmerId(swimmersData[0].id);
    }
  }, [selectedSwimmerId, swimmerId]);

  // Sync selection with URL parameter
  useEffect(() => {
    if (swimmerId) {
      setSelectedSwimmerId(swimmerId);
    }
  }, [swimmerId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const selectedSwimmer = useMemo(() => 
    swimmers.find(s => s.id === selectedSwimmerId), 
  [swimmers, selectedSwimmerId]);

  const getPerformanceDate = useCallback((p: Performance) => {
    const meet = meets.find(m => m.id === p.meetId);
    return meet ? meet.startDate : p.date;
  }, [meets]);

  const filteredPerformances = useMemo(() => {
    if (!selectedSwimmer || mode !== 'history') return [];
    
    let perfs = selectedSwimmer.performances.filter(p => {
      let passDist = filterDistance === 'all' ? true : p.distance === filterDistance;
      let passStroke = filterStroke === 'all' ? true : p.stroke === filterStroke;
      return passDist && passStroke;
    });

    perfs.sort((a, b) => {
      const dA = getPerformanceDate(a);
      const dB = getPerformanceDate(b);
      return dB.localeCompare(dA); 
    });

    return perfs;
  }, [selectedSwimmer, mode, filterDistance, filterStroke, getPerformanceDate]);

  const getPB = useCallback((stroke: Stroke, distance: Distance) => {
    if (!selectedSwimmer) return null;
    const same = selectedSwimmer.performances.filter(p => p.stroke === stroke && p.distance === distance);
    if (same.length === 0) return null;
    return same.reduce((prev, curr) => prev.timeMs < curr.timeMs ? prev : curr);
  }, [selectedSwimmer]);

  const chartData = useMemo(() => {
    if (!selectedSwimmer || filterStroke === 'all' || filterDistance === 'all') return [];
    
    // We need at least 2 points to make a line
    const data = [...filteredPerformances]
      .reverse() // Oldest first for the chart
      .map((p) => ({
        x: new Date(getPerformanceDate(p)).getTime(),
        y: p.timeMs
      }));
    
    return data;
  }, [filteredPerformances, filterStroke, filterDistance, getPerformanceDate, selectedSwimmer]);

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 0];
    const values = chartData.map(d => d.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.15 || 1000; // 15% padding or 1s
    return [Math.max(0, min - padding), max + padding];
  }, [chartData]);

  if (swimmers.length === 0) {
    return (
      <View style={globalStyles['page--centered']}>
        <FontAwesome name="trophy" size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
        <Text style={globalStyles.text__body}>{t('records.emptySwimmers')}</Text>
      </View>
    );
  }

  const ListHeader = (
    <View style={{ marginBottom: 16, paddingTop: 10 }}>
      {/* Swimmers Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, flexGrow: 0 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {swimmers.map(item => (
            <TouchableOpacity 
              key={item.id}
              style={[globalStyles.button, item.id !== selectedSwimmerId && globalStyles['button--secondary'], globalStyles['button--md']]}
              onPress={() => setSelectedSwimmerId(item.id)}
            >
              <Text style={[globalStyles.button__text, item.id !== selectedSwimmerId && globalStyles['button__text--secondary']]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modes Segmented Control */}
      <View style={{ flexDirection: 'row', gap: 0, marginBottom: 16, backgroundColor: colors.surfaceHighlight, borderRadius: 8, padding: 4 }}>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: mode === 'history' ? colors.primary : 'transparent', borderRadius: 6 }} onPress={() => setMode('history')}>
          <Text style={{ fontWeight: 'bold', color: mode === 'history' ? colors.background : colors.textPrimary }}>{t('records.modeHistory')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: mode === 'compare' ? colors.primary : 'transparent', borderRadius: 6 }} onPress={() => setMode('compare')}>
          <Text style={{ fontWeight: 'bold', color: mode === 'compare' ? colors.background : colors.textPrimary }}>{t('records.modeCompare')}</Text>
        </TouchableOpacity>
      </View>

      {/* Mode Filters */}
      {mode === 'history' && (
        <View style={{ gap: 10 }}>
          <View>
            <Text style={[globalStyles.text__caption, { marginBottom: 4 }]}>{t('records.filterDistancesTitle')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[globalStyles.button, filterDistance !== 'all' && globalStyles['button--secondary'], globalStyles['button--xs']]} onPress={() => setFilterDistance('all')}>
                  <Text style={[globalStyles.button__text, filterDistance !== 'all' && globalStyles['button__text--secondary'], { fontSize: 14 }]}>{t('records.allDistances')}</Text>
                </TouchableOpacity>
                {ALL_DISTANCES.map(d => (
                  <TouchableOpacity key={d} style={[globalStyles.button, filterDistance !== d && globalStyles['button--secondary'], globalStyles['button--xs']]} onPress={() => setFilterDistance(d)}>
                    <Text style={[globalStyles.button__text, filterDistance !== d && globalStyles['button__text--secondary'], { fontSize: 14 }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View>
            <Text style={[globalStyles.text__caption, { marginBottom: 4 }]}>{t('records.filterStrokesTitle')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[globalStyles.button, filterStroke !== 'all' && globalStyles['button--secondary'], globalStyles['button--xs']]} onPress={() => setFilterStroke('all')}>
                  <Text style={[globalStyles.button__text, filterStroke !== 'all' && globalStyles['button__text--secondary'], { fontSize: 14 }]}>{t('records.allStrokes')}</Text>
                </TouchableOpacity>
                {ALL_STROKES.map(s => (
                  <TouchableOpacity key={s} style={[globalStyles.button, filterStroke !== s && globalStyles['button--secondary'], globalStyles['button--xs']]} onPress={() => setFilterStroke(s)}>
                    <Text style={[globalStyles.button__text, filterStroke !== s && globalStyles['button__text--secondary'], { fontSize: 14 }]}>{t(`strokesShort.${s}` as any)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Progression Chart */}
      {mode === 'history' && filterStroke !== 'all' && filterDistance !== 'all' && (
        <View style={[globalStyles.card, { marginTop: 16, padding: 8 }]}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}
            onPress={() => setIsChartVisible(!isChartVisible)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <FontAwesome name="line-chart" size={14} color={colors.primary} />
              <Text style={[globalStyles.text__caption, { marginBottom: 0, fontWeight: 'bold', color: colors.primary }]}>
                {t('records.chartTitle' as any)}
              </Text>
            </View>
            <FontAwesome name={isChartVisible ? "eye-slash" : "eye"} size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {isChartVisible && (
            <View style={{ height: 210, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
              {chartData.length > 1 ? (
                <VictoryChart
                  key={`${selectedSwimmerId}-${filterStroke}-${filterDistance}`}
                  height={200}
                  width={350}
                  padding={{ top: 15, bottom: 10, left: 35, right: 15 }}
                  scale={{ x: "time" }}
                  domain={{ y: yDomain as [number, number] }}
                >
                  <VictoryAxis
                    style={{
                      axis: { stroke: "transparent" },
                      tickLabels: { fill: "transparent" },
                    }}
                  />
                  <VictoryAxis
                    dependentAxis
                    tickFormat={(t: number) => {
                      const m = Math.floor(t / 60000);
                      const s = Math.floor((t % 60000) / 1000);
                      return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
                    }}
                    style={{
                      axis: { stroke: colors.border },
                      tickLabels: { fill: colors.textSecondary, fontSize: 8 },
                      grid: { stroke: colors.surfaceHighlight, strokeDasharray: '4,4' }
                    }}
                  />
                  <VictoryLine
                    data={chartData}
                    interpolation="catmullRom"
                    style={{
                      data: { stroke: colors.primary, strokeWidth: 3 },
                    }}
                    animate={{ duration: 1000, onLoad: { duration: 500 } }}
                  />
                  <VictoryScatter
                    data={chartData}
                    size={4}
                    style={{
                      data: { fill: colors.background, stroke: colors.primary, strokeWidth: 2 }
                    }}
                  />
                </VictoryChart>
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                   <Text style={[globalStyles.text__caption, { textAlign: 'center' }]}>
                     {chartData.length === 1 ? t('records.chartEmpty' as any) : t('records.noData' as any)}
                   </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {mode === 'compare' && (
        <View>
          <Text style={[globalStyles.text__caption, { marginBottom: 4 }]}>{t('records.filterDistancesTitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {ALL_DISTANCES.map(d => (
                <TouchableOpacity key={d} style={[globalStyles.button, compareDistance !== d && globalStyles['button--secondary'], globalStyles['button--xs']]} onPress={() => setCompareDistance(d)}>
                  <Text style={[globalStyles.button__text, compareDistance !== d && globalStyles['button__text--secondary'], { fontSize: 14 }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={globalStyles.page}>
      <AppBackground />
      {mode === 'history' ? (
        <FlatList
          ListHeaderComponent={ListHeader}
          data={filteredPerformances}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <FontAwesome name="hourglass-o" size={32} color={colors.border} style={{ marginBottom: 12 }} />
              <Text style={globalStyles.text__caption}>{t('records.emptyPerformances')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const pb = getPB(item.stroke, item.distance);
            const isPB = pb?.id === item.id;
            const meetName = meets.find(m => m.id === item.meetId)?.name || 'Compétition Inconnue';
            const dateStr = dateToUI(getPerformanceDate(item));

            const sames = (selectedSwimmer?.performances || []).filter(p => p.stroke === item.stroke && p.distance === item.distance && p.poolLength === item.poolLength);
            sames.sort((a, b) => getPerformanceDate(b).localeCompare(getPerformanceDate(a)));
            const currentIndex = sames.findIndex(p => p.id === item.id);
            const previousPerf = currentIndex >= 0 && currentIndex + 1 < sames.length ? sames[currentIndex + 1] : null;

            let deltaStr = null;
            let deltaColor = colors.textSecondary;
            if (previousPerf) {
               const diffMs = item.timeMs - previousPerf.timeMs;
               if (diffMs !== 0) {
                 const sign = diffMs < 0 ? '-' : '+';
                 const absDiff = Math.abs(diffMs);
                 const sec = Math.floor(absDiff / 1000);
                 const cc = Math.floor((absDiff % 1000) / 10);
                 deltaStr = `${sign}${sec}.${cc.toString().padStart(2, '0')}`;
                 deltaColor = diffMs < 0 ? '#4CAF50' : '#F44336';
               }
            }

            return (
              <View style={[globalStyles.card, globalStyles['card--data'], isPB && { borderColor: colors.gold, borderWidth: 1 }]}>
                {editingId === item.id ? (
                  // ── Inline edit mode ──
                  <View>
                    <Text style={[globalStyles.text__caption, { marginBottom: 8 }]}>
                      {item.distance}m {t(`strokesShort.${item.stroke}` as any)} — {meetName}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <TextInput
                        style={[globalStyles.input, { width: 52, textAlign: 'center', marginBottom: 0 }]}
                        placeholder="mm" placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric" maxLength={2}
                        value={editMin}
                        onChangeText={v => { setEditMin(v.replace(/[^0-9]/g, '')); if (v.length >= 2) editSecRef.current?.focus(); }}
                      />
                      <Text style={[globalStyles.text__heading2, { marginBottom: 0 }]}>:</Text>
                      <TextInput
                        ref={editSecRef}
                        style={[globalStyles.input, { width: 52, textAlign: 'center', marginBottom: 0 }]}
                        placeholder="ss" placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric" maxLength={2}
                        value={editSec}
                        onChangeText={v => { setEditSec(v.replace(/[^0-9]/g, '')); if (v.length >= 2) editHunRef.current?.focus(); }}
                      />
                      <Text style={[globalStyles.text__heading2, { marginBottom: 0 }]}>.</Text>
                      <TextInput
                        ref={editHunRef}
                        style={[globalStyles.input, { width: 52, textAlign: 'center', marginBottom: 0 }]}
                        placeholder="cc" placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric" maxLength={2}
                        value={editHun}
                        onChangeText={v => setEditHun(v.replace(/[^0-9]/g, ''))}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={[globalStyles.button, globalStyles['button--sm'], { flex: 1 }]} onPress={() => handleSaveEdit(selectedSwimmerId!, item.id)}>
                        <Text style={globalStyles.button__text}>✓ Enregistrer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[globalStyles.button, globalStyles['button--secondary'], globalStyles['button--sm']]} onPress={() => { setEditingId(null); setConfirmDeleteId(null); }}>
                        <Text style={[globalStyles.button__text, globalStyles['button__text--secondary']]}>Annuler</Text>
                      </TouchableOpacity>
                      {confirmDeleteId === item.id ? (
                        <TouchableOpacity
                          style={[globalStyles.button, { backgroundColor: '#B71C1C', width: 40, height: 40, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' }]}
                          onPress={() => handleDelete(selectedSwimmerId!, item.id)}
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
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                           {isPB && <FontAwesome name="trophy" size={16} color={colors.gold} />}
                           <Text style={[globalStyles.card__title, { marginBottom: 0, color: isPB ? colors.gold : colors.primary }]}>
                             {item.distance}m {t(`strokesShort.${item.stroke}` as any)}
                           </Text>
                        </View>
                        <Text style={[globalStyles.text__body, { fontSize: 14 }]} numberOfLines={1}>
                          {meetName} - {dateStr}
                        </Text>
                        <Text style={globalStyles.text__caption}>
                          {t('records.poolLengthMini', { length: item.poolLength })}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                         <Text style={[globalStyles.text__heading2, { marginBottom: 0, color: isPB ? colors.gold : colors.textPrimary }]}>
                            {formatTimeMS(item.timeMs)}
                         </Text>
                         {deltaStr && (
                           <Text style={{ color: deltaColor, fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                             {deltaStr}
                           </Text>
                         )}
                         {isPB && !deltaStr && <Text style={{ color: colors.gold, fontSize: 10, fontWeight: 'bold' }}>{t('records.pbHighlight')}</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          ListHeaderComponent={ListHeader}
          data={ALL_STROKES}
          keyExtractor={item => item}
          renderItem={({ item: stroke }) => {
            const bestPerf = getPB(stroke, compareDistance);
            
            return (
              <View style={[globalStyles.card, globalStyles['card--data'], bestPerf && { borderColor: colors.gold, borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                     {bestPerf && <FontAwesome name="trophy" size={16} color={colors.gold} />}
                     <Text style={[globalStyles.card__title, { marginBottom: 0, color: bestPerf ? colors.gold : colors.primary }]}>
                       {t(`strokesShort.${stroke}` as any)}
                     </Text>
                   </View>
                   
                   {bestPerf ? (
                     <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[globalStyles.text__heading2, { marginBottom: 4, color: colors.gold }]}>
                          {formatTimeMS(bestPerf.timeMs)}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <FontAwesome name="calendar" size={10} color={colors.textSecondary} />
                          <Text style={[globalStyles.text__caption, { fontSize: 12 }]}>
                            {dateToUI(getPerformanceDate(bestPerf))}
                          </Text>
                        </View>
                     </View>
                   ) : (
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <FontAwesome name="times-circle" size={14} color={colors.border} />
                        <Text style={[globalStyles.text__caption, { fontStyle: 'italic' }]}>{t('records.noData')}</Text>
                     </View>
                   )}
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
