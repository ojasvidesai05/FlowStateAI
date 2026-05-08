import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPlan } from '../api/client';
import { theme } from '../theme';

export default function PlanScreen() {
  const [plan, setPlan] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const userId = await AsyncStorage.getItem('user_id');
    if (!userId) return;
    try {
      const res = await getPlan(userId);
      setPlan(res.data.plan);
      setUserProfile(res.data.user_profile);
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!plan) return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No plan yet</Text>
      <Text style={styles.emptyText}>Set up your goal first to see your full schedule here.</Text>
    </View>
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
        tintColor={theme.accent} />}>

      {/* Overload warning */}
      {plan.overload_warning && (
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>⚠️ Schedule is tight</Text>
          <Text style={styles.warningText}>
            Your available hours may not fully cover the prep needed.
            Consider extending your deadline or increasing daily hours.
          </Text>
        </View>
      )}

      {/* Meta */}
      <Text style={styles.meta}>
        {plan.tasks_scheduled} tasks · Generated {plan.generated_at}
        {userProfile ? `  ·  ${userProfile.exam_type?.toUpperCase()}` : ''}
      </Text>

      {/* Milestone deadlines */}
      <Text style={styles.sectionTitle}>MILESTONE TARGETS</Text>
      {plan.milestone_deadlines.map((md: any) => (
        <View key={md.milestone_id} style={styles.milestoneRow}>
          <Text style={styles.milestoneName}>{md.milestone_title}</Text>
          <View style={styles.milestoneDateBadge}>
            <Text style={styles.milestoneDateText}>{md.target_date}</Text>
          </View>
        </View>
      ))}

      {/* Weekly schedule */}
      {plan.weekly_schedule.map((week: any) => (
        <View key={week.week}>
          <Text style={styles.weekHeader}>WEEK {week.week}</Text>
          {week.days.map((day: any) => {
            const isToday = day.date === today;
            return (
              <View
                key={day.date}
                style={[
                  styles.dayCard,
                  day.is_buffer_day && styles.dayCardBuffer,
                  day.is_mock_day && styles.dayCardMock,
                  isToday && styles.dayCardToday,
                ]}>
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayName}>
                      {day.day_of_week}
                      {isToday ? '  ← today' : ''}
                    </Text>
                    <Text style={styles.dayDate}>{day.date}</Text>
                  </View>
                  <View style={styles.dayBadgeRow}>
                    {day.is_buffer_day && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>BUFFER</Text>
                      </View>
                    )}
                    {day.is_mock_day && (
                      <View style={[styles.badge, styles.badgeMock]}>
                        <Text style={[styles.badgeText, styles.badgeTextMock]}>MOCK TEST</Text>
                      </View>
                    )}
                  </View>
                </View>

                {day.tasks.length === 0 ? (
                  <Text style={styles.restText}>Rest / catch-up day</Text>
                ) : (
                  day.tasks.map((task: any) => (
                    <View key={task.id} style={styles.taskRow}>
                      <View style={styles.taskDot} />
                      <Text style={styles.taskText} numberOfLines={2}>{task.title}</Text>
                      <View style={styles.taskTimeBadge}>
                        <Text style={styles.taskTimeText}>{task.duration_minutes}m</Text>
                      </View>
                    </View>
                  ))
                )}

                {day.total_minutes > 0 && (
                  <Text style={styles.dayTotal}>
                    Total: {Math.round(day.total_minutes / 60 * 10) / 10}h
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: theme.pad },
  emptyContainer: { flex: 1, backgroundColor: theme.bg, alignItems: 'center',
    justifyContent: 'center', padding: theme.pad },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: theme.text, fontSize: theme.fontL, fontWeight: '800', marginBottom: 6 },
  emptyText: { color: theme.textMid, fontSize: theme.fontS, textAlign: 'center', lineHeight: 22 },

  warning: {
    backgroundColor: '#FEF3CD',
    borderRadius: theme.radiusSm,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#E8A020',
  },
  warningTitle: { color: '#7A4F00', fontSize: theme.fontXS, fontWeight: '800', marginBottom: 4 },
  warningText: { color: '#7A4F00', fontSize: theme.fontXXS, lineHeight: 18 },

  meta: { color: theme.textLight, fontSize: theme.fontXXS, marginBottom: 18 },

  sectionTitle: {
    color: theme.textLight,
    fontSize: theme.fontXXS,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  milestoneName: { color: theme.text, fontSize: theme.fontXS, flex: 1, marginRight: 12 },
  milestoneDateBadge: {
    backgroundColor: theme.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  milestoneDateText: { color: theme.accent, fontSize: theme.fontXXS, fontWeight: '800' },

  weekHeader: {
    color: theme.textLight,
    fontSize: theme.fontXXS,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
  },
  dayCard: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.radiusSm,
    padding: 14,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dayCardBuffer: { backgroundColor: theme.accentSoft, borderColor: '#F0C89A' },
  dayCardMock: { backgroundColor: '#EEF0FF', borderColor: '#B0B8FF' },
  dayCardToday: { borderColor: theme.accent, borderWidth: 2 },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dayName: { color: theme.text, fontSize: theme.fontXS, fontWeight: '700' },
  dayDate: { color: theme.textLight, fontSize: theme.fontXXS, marginTop: 2 },
  dayBadgeRow: { flexDirection: 'row', gap: 6 },
  badge: {
    backgroundColor: '#F0C89A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 100,
  },
  badgeText: { color: theme.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  badgeMock: { backgroundColor: '#B0B8FF' },
  badgeTextMock: { color: '#3040CC' },

  restText: { color: theme.textLight, fontSize: theme.fontXXS, fontStyle: 'italic' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  taskDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: theme.accent,
    marginTop: 1,
    flexShrink: 0,
  },
  taskText: { flex: 1, color: theme.textMid, fontSize: theme.fontXXS, lineHeight: 16 },
  taskTimeBadge: {
    backgroundColor: theme.bgSunken,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radiusXs,
  },
  taskTimeText: { color: theme.textLight, fontSize: 9, fontWeight: '700' },
  dayTotal: {
    color: theme.textLight,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 6,
    fontStyle: 'italic',
  },
});