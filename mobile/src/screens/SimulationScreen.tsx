import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { simulate, applyScenario } from '../api/client';
import { theme } from '../theme';

const PRESETS = [
  { icon: '📉', text: 'I have college exams — only 1 hour/day for 2 weeks' },
  { icon: '📈', text: 'I want to double my weekend hours from now' },
  { icon: '🏖️', text: 'Take a full week off next week' },
  { icon: '🔁', text: 'Add a full mock test every Sunday from today' },
  { icon: '🚨', text: "I'm 3 milestones behind — what's the minimum daily hours to recover?" },
];

export default function SimulationScreen({ navigation }: any) {
  const [scenario, setScenario] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const runSim = async () => {
    if (!scenario.trim()) { Alert.alert('Enter a scenario first'); return; }
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) { Alert.alert('Set up your goal first'); return; }
    setLoading(true);
    setResult(null);
    setApplied(false);
    try {
      const res = await simulate(userId, scenario);
      setResult(res.data);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  const handleApply = async () => {
    const userId = await AsyncStorage.getItem('user_id');
    setApplying(true);
    try {
      await applyScenario(userId!, scenario);
      setApplied(true);
      Alert.alert(
        '✅ Plan Updated',
        'Your plan has been adjusted. Check the Dashboard and Plan tabs.',
        [{ text: 'View Dashboard', onPress: () => navigation.navigate('Dashboard') }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setApplying(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>What if...?</Text>
      <Text style={styles.sub}>
        Explore how schedule changes affect your exam readiness before committing to them.
      </Text>

      <Text style={styles.sectionTitle}>QUICK SCENARIOS</Text>
      {PRESETS.map((p, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.preset, scenario === p.text && styles.presetActive]}
          onPress={() => setScenario(p.text)}>
          <Text style={styles.presetIcon}>{p.icon}</Text>
          <Text style={styles.presetText}>{p.text}</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>OR DESCRIBE YOUR SCENARIO</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. My coaching ends early — I can add 1.5 hours on weekdays from March..."
        placeholderTextColor={theme.textLight}
        value={scenario}
        onChangeText={setScenario}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={runSim} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Run Simulation →</Text>}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Simulation Result</Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>New completion date</Text>
            <Text style={styles.resultValue}>{result.new_completion_date}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Days impact</Text>
            <Text style={[
              styles.resultValue,
              result.days_delayed > 0 ? styles.resultNeg : styles.resultPos
            ]}>
              {result.days_delayed > 0
                ? `+${result.days_delayed} days delayed`
                : result.days_delayed < 0
                  ? `${Math.abs(result.days_delayed)} days earlier`
                  : 'No change'}
            </Text>
          </View>

          {result.hours_lost != null && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Hours affected</Text>
              <Text style={styles.resultValue}>{result.hours_lost}h</Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.impactText}>{result.impact_summary}</Text>

          <View style={styles.recommendBox}>
            <Text style={styles.recommendLabel}>💡 RECOMMENDATION</Text>
            <Text style={styles.recommendText}>{result.recommendation}</Text>
          </View>

          {!applied && (
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} disabled={applying}>
              {applying
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={styles.applyBtnTitle}>Apply to My Plan</Text>
                    <Text style={styles.applyBtnSub}>Updates your schedule in the Dashboard</Text>
                  </>}
            </TouchableOpacity>
          )}

          {applied && (
            <View style={styles.appliedBadge}>
              <Text style={styles.appliedText}>✓ Applied — plan updated</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: theme.pad },
  heading: {
    color: theme.text,
    fontSize: theme.fontXXL,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 8,
    marginBottom: 4,
  },
  sub: { color: theme.textMid, fontSize: theme.fontXS, lineHeight: 20, marginBottom: 24 },
  sectionTitle: {
    color: theme.textLight,
    fontSize: theme.fontXXS,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  preset: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.radiusSm,
    padding: 14,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  presetActive: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  presetIcon: { fontSize: 18 },
  presetText: { color: theme.text, fontSize: theme.fontXS, flex: 1, lineHeight: 18 },
  input: {
    backgroundColor: theme.bgSunken,
    color: theme.text,
    borderRadius: theme.radiusSm,
    padding: 14,
    borderWidth: 1.5,
    borderColor: theme.border,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: theme.fontS,
    lineHeight: 22,
  },
  button: {
    backgroundColor: theme.accent,
    padding: 17,
    borderRadius: theme.radius,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: theme.fontS, letterSpacing: 0.3 },
  resultCard: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.radius,
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultTitle: {
    color: theme.text,
    fontSize: theme.fontM,
    fontWeight: '900',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  resultLabel: { color: theme.textMid, fontSize: theme.fontXS },
  resultValue: {
    color: theme.text,
    fontSize: theme.fontXS,
    fontWeight: '700',
    backgroundColor: theme.bgSunken,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  resultNeg: { color: theme.danger },
  resultPos: { color: theme.success },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 14 },
  impactText: {
    color: theme.textMid,
    fontSize: theme.fontXS,
    lineHeight: 20,
    marginBottom: 14,
  },
  recommendBox: {
    backgroundColor: theme.accentSoft,
    borderRadius: theme.radiusSm,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: theme.accent,
  },
  recommendLabel: {
    color: theme.accent,
    fontSize: theme.fontXXS,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  recommendText: { color: theme.text, fontSize: theme.fontXS, lineHeight: 20 },
  applyBtn: {
    backgroundColor: theme.accent,
    borderRadius: theme.radiusSm,
    padding: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  applyBtnTitle: { color: '#fff', fontWeight: '900', fontSize: theme.fontS },
  applyBtnSub: { color: '#ffffffaa', fontSize: theme.fontXXS, marginTop: 2 },
  appliedBadge: {
    backgroundColor: theme.accentSoft,
    borderRadius: theme.radiusSm,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  appliedText: { color: theme.success, fontWeight: '700', fontSize: theme.fontXS },
});