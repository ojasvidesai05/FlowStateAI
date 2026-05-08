import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupGoal } from '../api/client';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const USER_ID = 'user_001';

const EXAM_OPTIONS = [
  { id: 'gate_cse', label: 'GATE CSE', icon: '💻', sub: 'Computer Science', suggestedDeadline: '2027-02-01', hint: 'Feb 2027' },
  { id: 'gate_ece', label: 'GATE ECE', icon: '📡', sub: 'Electronics & Comm.', suggestedDeadline: '2027-02-01', hint: 'Feb 2027' },
  { id: 'gate_ee',  label: 'GATE EE',  icon: '⚡', sub: 'Electrical Engg.',    suggestedDeadline: '2027-02-01', hint: 'Feb 2027' },
  { id: 'jee',      label: 'JEE',       icon: '🔬', sub: 'Mains & Advanced',    suggestedDeadline: '2027-04-01', hint: 'Apr 2027' },
  { id: 'neet',     label: 'NEET',      icon: '🏥', sub: 'UG Medical Entrance', suggestedDeadline: '2027-05-01', hint: 'May 2027' },
  { id: 'placement',label: 'Placements',icon: '💼', sub: 'Campus Recruitment',  suggestedDeadline: '2026-10-01', hint: 'Oct 2026' },
  { id: 'upsc',     label: 'UPSC',      icon: '🏛️', sub: 'Prelims + Mains',     suggestedDeadline: '2027-05-25', hint: 'May 2027' },
  { id: 'custom',   label: 'Other',     icon: '🎯', sub: 'Custom goal',         suggestedDeadline: '',           hint: '' },
];

const STEPS = ['Exam', 'Subjects', 'Schedule', 'Review'];

export default function GoalSetupScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [selectedExam, setSelectedExam] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [weakSubjects, setWeakSubjects] = useState('');
  const [strongSubjects, setStrongSubjects] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [availableWeekday, setAvailableWeekday] = useState('2');
  const [availableWeekend, setAvailableWeekend] = useState('4');
  const [interruption, setInterruption] = useState('medium');
  const [commitments, setCommitments] = useState('');
  const [loading, setLoading] = useState(false);

  const examObj = EXAM_OPTIONS.find(e => e.id === selectedExam);

  const handleExamSelect = (exam: typeof EXAM_OPTIONS[0]) => {
    setSelectedExam(exam.id);
    if (exam.suggestedDeadline) setDeadline(exam.suggestedDeadline);
  };

  const canProceed = () => {
    if (step === 0) return !!selectedExam;
    if (step === 1) return selectedExam === 'custom' ? !!customGoal : !!weakSubjects;
    if (step === 2) return !!deadline && !!availableWeekday && !!availableWeekend;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const goal = selectedExam === 'custom'
      ? customGoal
      : `Crack ${examObj?.label} — ${deadline}. Weak: ${weakSubjects}. Strong: ${strongSubjects || 'None'}.`;
    try {
      const res = await setupGoal({
        user_id: USER_ID,
        exam_type: selectedExam,
        goal,
        weak_subjects: weakSubjects || 'None',
        strong_subjects: strongSubjects || 'None',
        skill_level: skillLevel,
        deadline,
        fixed_commitments: commitments ? [{ label: commitments, all_day: false }] : [],
        available_hours_weekday: parseFloat(availableWeekday) || 2,
        available_hours_weekend: parseFloat(availableWeekend) || 4,
        interruption_frequency: interruption,
      });
      await AsyncStorage.setItem('user_id', USER_ID);
      await AsyncStorage.setItem('plan_data', JSON.stringify(res.data));
      navigation.navigate('Dashboard');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  const ChipBtn = ({ label, value, current, onPress }: any) => (
    <TouchableOpacity
      style={[styles.chip, current === value && styles.chipActive]}
      onPress={onPress}>
      <Text style={[styles.chipText, current === value && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  // ── Step renders ──────────────────────────────────────────────

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>What are you{'\n'}preparing for?</Text>
      <Text style={styles.stepSub}>Choose your target exam — we'll load the official syllabus automatically.</Text>
      <View style={styles.examGrid}>
        {EXAM_OPTIONS.map(exam => (
          <TouchableOpacity
            key={exam.id}
            style={[styles.examCard, selectedExam === exam.id && styles.examCardActive]}
            onPress={() => handleExamSelect(exam)}
            activeOpacity={0.7}>
            <Text style={styles.examIcon}>{exam.icon}</Text>
            <Text style={[styles.examLabel, selectedExam === exam.id && styles.examLabelActive]}>
              {exam.label}
            </Text>
            <Text style={styles.examSub}>{exam.sub}</Text>
            {exam.hint ? <Text style={styles.examHint}>{exam.hint}</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>Subject{'\n'}Assessment</Text>
      <Text style={styles.stepSub}>
        We'll give your weak subjects 40% more time and schedule them first each day.
      </Text>

      {selectedExam === 'custom' && (
        <>
          <Text style={styles.fieldLabel}>Describe your goal</Text>
          <TextInput style={styles.input} placeholder="e.g. Learn Spanish to B2 level..."
            placeholderTextColor={theme.textLight} value={customGoal}
            onChangeText={setCustomGoal} multiline />
        </>
      )}

      <Text style={styles.fieldLabel}>Weak subjects / topics ← more time here</Text>
      <TextInput
        style={[styles.input, styles.inputHighlight]}
        placeholder={
          selectedExam.startsWith('gate') ? 'e.g. Signals & Systems, Thermodynamics, TOC' :
          selectedExam === 'jee'  ? 'e.g. Organic Chemistry, Rotational Motion, Integration' :
          selectedExam === 'neet' ? 'e.g. Genetics, Organic Chemistry, Optics' :
          selectedExam === 'placement' ? 'e.g. Dynamic Programming, OS, Graphs' :
          selectedExam === 'upsc' ? 'e.g. Economy, Environment, History' :
          'Your weak topics...'
        }
        placeholderTextColor={theme.textLight}
        value={weakSubjects}
        onChangeText={setWeakSubjects}
        multiline
      />

      <Text style={styles.fieldLabel}>Strong subjects (less time needed)</Text>
      <TextInput style={styles.input}
        placeholder="e.g. Engineering Maths, Algebra, Mechanics..."
        placeholderTextColor={theme.textLight}
        value={strongSubjects} onChangeText={setStrongSubjects} />

      <Text style={styles.fieldLabel}>Current preparation level</Text>
      <View style={styles.row}>
        <ChipBtn label="Beginner" value="beginner" current={skillLevel} onPress={() => setSkillLevel('beginner')} />
        <ChipBtn label="Intermediate" value="intermediate" current={skillLevel} onPress={() => setSkillLevel('intermediate')} />
        <ChipBtn label="Advanced" value="advanced" current={skillLevel} onPress={() => setSkillLevel('advanced')} />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>Your{'\n'}Schedule</Text>
      <Text style={styles.stepSub}>
        We fit your prep into the gaps in your real life — not an ideal world.
      </Text>

      <Text style={styles.fieldLabel}>
        Exam / target date{examObj?.hint ? `  (typical: ${examObj.hint})` : ''}
      </Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textLight} value={deadline}
        onChangeText={setDeadline} keyboardType="numeric" />

      <Text style={styles.fieldLabel}>Free study hours on weekdays</Text>
      <View style={styles.hoursRow}>
        {['1', '1.5', '2', '2.5', '3', '4', '5'].map(h => (
          <TouchableOpacity key={h}
            style={[styles.hoursChip, availableWeekday === h && styles.hoursChipActive]}
            onPress={() => setAvailableWeekday(h)}>
            <Text style={[styles.hoursChipText, availableWeekday === h && styles.hoursChipTextActive]}>
              {h}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Free study hours on weekends</Text>
      <View style={styles.hoursRow}>
        {['2', '3', '4', '5', '6', '8'].map(h => (
          <TouchableOpacity key={h}
            style={[styles.hoursChip, availableWeekend === h && styles.hoursChipActive]}
            onPress={() => setAvailableWeekend(h)}>
            <Text style={[styles.hoursChipText, availableWeekend === h && styles.hoursChipTextActive]}>
              {h}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>How often do disruptions happen?</Text>
      <View style={styles.row}>
        <ChipBtn label="Rarely" value="low" current={interruption} onPress={() => setInterruption('low')} />
        <ChipBtn label="Sometimes" value="medium" current={interruption} onPress={() => setInterruption('medium')} />
        <ChipBtn label="Often" value="high" current={interruption} onPress={() => setInterruption('high')} />
      </View>
      <Text style={styles.hintText}>
        {interruption === 'low' ? '5% buffer reserved for catch-up' :
         interruption === 'medium' ? '15% buffer — typical for active college students' :
         '25% buffer — coaching + college + frequent schedule breaks'}
      </Text>

      <Text style={styles.fieldLabel}>Fixed commitments (optional)</Text>
      <TextInput style={styles.input}
        placeholder="e.g. College Mon–Fri 9am–5pm, Coaching Sat 10am–1pm"
        placeholderTextColor={theme.textLight}
        value={commitments} onChangeText={setCommitments} />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeading}>Mission{'\n'}Briefing</Text>
      <Text style={styles.stepSub}>Here's what your AI coach will build for you.</Text>

      <View style={styles.reviewCard}>
        <ReviewRow icon="🎯" label="Exam" value={examObj?.label || selectedExam} />
        <ReviewRow icon="📅" label="Exam date" value={deadline} />
        <ReviewRow icon="⚠️" label="Weak areas" value={weakSubjects || 'None'} />
        <ReviewRow icon="💪" label="Strong areas" value={strongSubjects || 'None'} />
        <ReviewRow icon="📊" label="Level" value={skillLevel} />
        <ReviewRow icon="⏱️" label="Weekday hours" value={`${availableWeekday}h/day`} />
        <ReviewRow icon="☀️" label="Weekend hours" value={`${availableWeekend}h/day`} />
        <ReviewRow icon="🎲" label="Disruption buffer"
          value={interruption === 'low' ? '5%' : interruption === 'medium' ? '15%' : '25%'} />
      </View>

      <View style={styles.whatYouGet}>
        <Text style={styles.whatYouGetTitle}>What you'll get</Text>
        <Text style={styles.whatYouGetItem}>📚 Syllabus-mapped daily tasks (real topics, not generic)</Text>
        <Text style={styles.whatYouGetItem}>🔄 Buffer days built in every 5 days</Text>
        <Text style={styles.whatYouGetItem}>🧪 Mock test Sundays scheduled automatically</Text>
        <Text style={styles.whatYouGetItem}>🛠️ Auto-rescheduling when you miss tasks</Text>
        <Text style={styles.whatYouGetItem}>🔮 What-if simulation before making changes</Text>
      </View>
    </View>
  );

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.progressItem}>
            <View style={[styles.progressDot, i <= step && styles.progressDotActive,
              i < step && styles.progressDotDone]}>
              {i < step
                ? <Text style={styles.progressCheck}>✓</Text>
                : <Text style={[styles.progressNum, i === step && styles.progressNumActive]}>
                    {i + 1}
                  </Text>}
            </View>
            <Text style={[styles.progressLabel, i === step && styles.progressLabelActive]}>
              {s}
            </Text>
          </View>
        ))}
        {/* Connector lines */}
        <View style={styles.progressLine} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
        {steps[step]()}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom navigation */}
      <View style={styles.navBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled,
            step === 0 && { flex: 1 }]}
          onPress={step < 3 ? () => setStep(s => s + 1) : handleSubmit}
          disabled={!canProceed() || loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.nextBtnText}>
                {step === 3 ? 'Build My Plan →' : 'Continue →'}
              </Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReviewRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewIcon}>{icon}</Text>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scrollArea: { flex: 1 },
  stepContent: { padding: theme.pad, paddingBottom: 0 },
  stepHeading: {
    color: theme.text, fontSize: theme.fontXXL, fontWeight: '900',
    letterSpacing: -1, lineHeight: 36, marginTop: 8, marginBottom: 6,
  },
  stepSub: {
    color: theme.textMid, fontSize: theme.fontXS, lineHeight: 20, marginBottom: 24,
  },

  // Progress bar
  progressContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
    backgroundColor: theme.bg, position: 'relative',
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  progressLine: {
    position: 'absolute', top: 28, left: 50, right: 50,
    height: 1, backgroundColor: theme.border, zIndex: 0,
  },
  progressItem: { alignItems: 'center', zIndex: 1 },
  progressDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: theme.bgCard,
    borderWidth: 2, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  progressDotActive: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  progressDotDone: { backgroundColor: theme.accent, borderColor: theme.accent },
  progressNum: { color: theme.textLight, fontSize: 11, fontWeight: '700' },
  progressNumActive: { color: theme.accent },
  progressCheck: { color: '#fff', fontSize: 12, fontWeight: '900' },
  progressLabel: { color: theme.textLight, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  progressLabelActive: { color: theme.accent },

  // Exam grid
  examGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  examCard: {
    width: '47%', paddingVertical: 18, paddingHorizontal: 14,
    borderRadius: theme.radius, backgroundColor: theme.bgCard,
    borderWidth: 1.5, borderColor: theme.border,
  },
  examCardActive: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
  examIcon: { fontSize: 26, marginBottom: 8 },
  examLabel: { color: theme.text, fontSize: theme.fontS, fontWeight: '800', marginBottom: 2 },
  examLabelActive: { color: theme.accent },
  examSub: { color: theme.textLight, fontSize: theme.fontXXS, lineHeight: 14 },
  examHint: { color: theme.accent, fontSize: theme.fontXXS, marginTop: 6, fontWeight: '700' },

  // Fields
  fieldLabel: {
    color: theme.text, fontSize: theme.fontXXS, fontWeight: '800',
    letterSpacing: 0.9, textTransform: 'uppercase', marginTop: 20, marginBottom: 7,
  },
  input: {
    backgroundColor: theme.bgSunken, color: theme.text,
    borderRadius: theme.radiusSm, padding: 13,
    borderWidth: 1.5, borderColor: theme.border,
    fontSize: theme.fontS, lineHeight: 20,
  },
  inputHighlight: { borderColor: theme.accent },
  hintText: { color: theme.textLight, fontSize: 10, marginTop: 5, fontStyle: 'italic' },

  // Hours chips
  hoursRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hoursChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    backgroundColor: theme.bgCard, borderWidth: 1.5, borderColor: theme.border,
  },
  hoursChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  hoursChipText: { color: theme.textMid, fontSize: theme.fontXS, fontWeight: '600' },
  hoursChipTextActive: { color: '#fff', fontWeight: '800' },

  // Chips
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100,
    backgroundColor: theme.bgCard, borderWidth: 1.5, borderColor: theme.border,
  },
  chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipText: { color: theme.textMid, fontSize: theme.fontXS, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '800' },

  // Review
  reviewCard: {
    backgroundColor: theme.bgCard, borderRadius: theme.radius,
    borderWidth: 1, borderColor: theme.border, overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: theme.border, gap: 10,
  },
  reviewIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  reviewLabel: { color: theme.textMid, fontSize: theme.fontXS, width: 110 },
  reviewValue: { color: theme.text, fontSize: theme.fontXS, fontWeight: '700', flex: 1 },

  whatYouGet: {
    backgroundColor: theme.accentSoft, borderRadius: theme.radiusSm,
    padding: 16, marginTop: 16, borderLeftWidth: 3, borderLeftColor: theme.accent,
  },
  whatYouGetTitle: {
    color: theme.accent, fontSize: theme.fontXXS, fontWeight: '900',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },
  whatYouGetItem: {
    color: theme.text, fontSize: theme.fontXS, lineHeight: 24,
  },

  // Nav
  navBar: {
    flexDirection: 'row', gap: 10, padding: 16,
    borderTopWidth: 1, borderTopColor: theme.border,
    backgroundColor: theme.bg,
  },
  backBtn: {
    paddingHorizontal: 18, paddingVertical: 16, borderRadius: theme.radiusSm,
    backgroundColor: theme.bgSunken, borderWidth: 1, borderColor: theme.border,
  },
  backBtnText: { color: theme.textMid, fontWeight: '700', fontSize: theme.fontS },
  nextBtn: {
    flex: 1, backgroundColor: theme.accent, padding: 16,
    borderRadius: theme.radiusSm, alignItems: 'center',
    shadowColor: theme.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  nextBtnDisabled: { backgroundColor: theme.border, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { color: '#fff', fontWeight: '900', fontSize: theme.fontS, letterSpacing: 0.3 },
});