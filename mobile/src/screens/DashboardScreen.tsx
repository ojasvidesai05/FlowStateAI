import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPlan, reportMissedTasks, checkin } from '../api/client';
import { theme } from '../theme';

export default function DashboardScreen() {
  const [plan, setPlan] = useState<any>(null);
  const [decomposition, setDecomposition] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadData = useCallback(async () => {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) return;
    try {
      const res = await getPlan(userId);
      setPlan(res.data.plan);
      setDecomposition(res.data.decomposition);
      setUserProfile(res.data.user_profile);

      const today = new Date().toISOString().split('T')[0];
      let found: any[] = [];
      for (const week of res.data.plan.weekly_schedule) {
        for (const day of week.days) {
          if (day.date === today) { found = day.tasks; break; }
        }
      }
      setTodayTasks(found);
    } catch { /* no plan yet */ }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleTask = (id: string) => {
    const updated = new Set(checkedIds);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    setCheckedIds(updated);
  };

  const handleSubmit = async () => {
    const userId = await AsyncStorage.getItem('user_id');
    const completedIds = [...checkedIds];
    const missedIds = todayTasks
      .filter(t => !checkedIds.has(t.id))
      .map(t => t.id);

    const status = missedIds.length === 0 ? 'done'
      : completedIds.length === 0 ? 'missed'
      : 'partial';

    try {
      await checkin(userId!, status, completedIds);
      if (missedIds.length > 0) {
        await reportMissedTasks(userId!, missedIds);
        Alert.alert(
          status === 'partial' ? '📋 Partially done' : '😔 Tasks missed',
          `${missedIds.length} task(s) rescheduled into buffer slots automatically.`
        );
      } else {
        Alert.alert('🎉 All done!', `Great work! Streak: ${(userProfile?.streak || 0) + 1} days.`);
      }
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const doneCount = checkedIds.size;
  const totalCount = todayTasks.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const daysLeft = userProfile?.deadline
    ? Math.max(0, Math.ceil(
        (new Date(userProfile.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    : null;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
        tintColor={theme.accent} />}>

      {!plan ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>No plan yet</Text>
          <Text style={styles.emptyText}>Go to the Goal tab to set up your exam prep plan.</Text>
        </View>
      ) : (
        <>
          {/* Exam badge + days remaining */}
          <View style={styles.examBanner}>
            <View>
              <Text style={styles.examBannerLabel}>PREPARING FOR</Text>
              <Text style={styles.examBannerTitle}>
                {userProfile?.exam_type?.toUpperCase() || 'EXAM'}
              </Text>
            </View>
            {daysLeft !== null && (
              <View style={styles.daysBox}>
                <Text style={styles.daysNum}>{daysLeft}</Text>
                <Text style={styles.daysLabel}>days left</Text>
              </View>
            )}
          </View>

          {/* Progress card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TODAY'S PROGRESS</Text>
            <View style={styles.progressRow}>
              <Text style={styles.bigPct}>{pct}<Text style={styles.bigPctUnit}>%</Text></Text>
              <View style={styles.progressRight}>
                <Text style={styles.progressFraction}>{doneCount}/{totalCount} tasks</Text>
                {userProfile?.streak > 0 && (
                  <Text style={styles.streak}>🔥 {userProfile.streak} day streak</Text>
                )}
              </View>
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${pct}%` as any }]} />
            </View>
          </View>

          {/* Weak subject focus */}
          {userProfile?.weak_subjects && (
            <View style={styles.focusBanner}>
              <Text style={styles.focusLabel}>TODAY'S FOCUS AREA</Text>
              <Text style={styles.focusValue}>{userProfile.weak_subjects.split(',')[0].trim()}</Text>
              <Text style={styles.focusSub}>Your weakest subject — prioritise it first.</Text>
            </View>
          )}

          {/* Today's tasks */}
          <Text style={styles.sectionTitle}>TODAY'S TASKS</Text>

          {todayTasks.length === 0 ? (
            <View style={styles.restCard}>
              <Text style={styles.restIcon}>😌</Text>
              <Text style={styles.restText}>Rest or buffer day — you've earned it.</Text>
            </View>
          ) : (
            todayTasks.map(task => {
              const done = checkedIds.has(task.id);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskCard, done && styles.taskCardDone]}
                  onPress={() => toggleTask(task.id)}
                  activeOpacity={0.7}>
                  <View style={[styles.checkbox, done && styles.checkboxDone]}>
                    {done && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskMeta}>
                      {task.duration_minutes} min
                      {task.subject ? `  ·  ${task.subject}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {todayTasks.length > 0 && !submitted && (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit Today's Progress</Text>
            </TouchableOpacity>
          )}

          {submitted && (
            <View style={styles.submittedBadge}>
              <Text style={styles.submittedText}>✓ Today's progress submitted</Text>
            </View>
          )}

          {/* Milestones */}
          {decomposition?.milestones && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 28 }]}>MILESTONES</Text>
              {decomposition.milestones.map((m: any, i: number) => (
                <View key={m.id} style={styles.milestoneCard}>
                  <View style={styles.milestoneLeft}>
                    <Text style={styles.milestoneNum}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.milestoneTitle}>{m.title}</Text>
                    <Text style={styles.milestoneMeta}>
                      {m.estimated_hours}h · {m.subject_focus || m.description}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: theme.pad },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: theme.text, fontSize: theme.fontL, fontWeight: '800', marginBottom: 6 },
  emptyText: { color: theme.textMid, fontSize: theme.fontS, textAlign: 'center', lineHeight: 22 },

  examBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.text,
    borderRadius: theme.radius,
    padding: 18,
    marginBottom: 14,
  },
  examBannerLabel: {
    color: theme.textLight,
    fontSize: theme.fontXXS,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 3,
  },
  examBannerTitle: {
    color: '#FAF8F3',
    fontSize: theme.fontL,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  daysBox: { alignItems: 'center' },
  daysNum: {
    color: theme.accent,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 36,
  },
  daysLabel: { color: theme.textLight, fontSize: theme.fontXXS, fontWeight: '600', letterSpacing: 0.5 },

  card: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.radius,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardLabel: {
    color: theme.textLight,
    fontSize: theme.fontXXS,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  progressRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginBottom: 14 },
  bigPct: {
    color: theme.text,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 52,
  },
  bigPctUnit: { fontSize: 24, letterSpacing: 0 },
  progressRight: { paddingBottom: 6 },
  progressFraction: { color: theme.textMid, fontSize: theme.fontXS, fontWeight: '600' },
  streak: { color: theme.accent, fontSize: theme.fontXS, fontWeight: '700', marginTop: 4 },
  bar: {
    height: 5,
    backgroundColor: theme.bgSunken,
    borderRadius: 3,
  },
  barFill: { height: 5, backgroundColor: theme.accent, borderRadius: 3 },

  focusBanner: {
    backgroundColor: theme.accentSoft,
    borderRadius: theme.radiusSm,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.accent,
  },
  focusLabel: {
    color: theme.accent,
    fontSize: theme.fontXXS,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 3,
  },
  focusValue: { color: theme.text, fontSize: theme.fontM, fontWeight: '800' },
  focusSub: { color: theme.textMid, fontSize: theme.fontXXS, marginTop: 2 },

  sectionTitle: {
    color: theme.textLight,
    fontSize: theme.fontXXS,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 10,
  },

  restCard: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.radiusSm,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  restIcon: { fontSize: 32, marginBottom: 8 },
  restText: { color: theme.textMid, fontSize: theme.fontS, textAlign: 'center' },

  taskCard: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.radiusSm,
    padding: 15,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  taskCardDone: { backgroundColor: theme.bgSunken, borderColor: theme.border },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: theme.accent, borderColor: theme.accent },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '900' },
  taskTitle: { color: theme.text, fontSize: theme.fontS, fontWeight: '500', lineHeight: 20 },
  taskTitleDone: { textDecorationLine: 'line-through', color: theme.textLight },
  taskMeta: { color: theme.textLight, fontSize: theme.fontXXS, marginTop: 2 },

  submitBtn: {
    backgroundColor: theme.text,
    padding: 16,
    borderRadius: theme.radius,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  submitBtnText: { color: theme.bg, fontWeight: '900', fontSize: theme.fontS },

  submittedBadge: {
    backgroundColor: theme.successSoft,
    borderRadius: theme.radiusSm,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submittedText: { color: theme.success, fontWeight: '700', fontSize: theme.fontXS },

  milestoneCard: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.radiusSm,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  milestoneLeft: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  milestoneNum: { color: theme.accent, fontSize: theme.fontXS, fontWeight: '900' },
  milestoneTitle: { color: theme.text, fontSize: theme.fontS, fontWeight: '600', lineHeight: 20 },
  milestoneMeta: { color: theme.textMid, fontSize: theme.fontXXS, marginTop: 3, lineHeight: 16 },
});