// app/(tabs)/index.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { router } from 'expo-router';
import { supabase, getTopics, getStreak } from '../../lib/supabase';
import type { Topic, StreakData } from '../../types';
import TopicIcon from '../../components/TopicIcon';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function HomeScreen() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const task = InteractionManager.runAfterInteractions(() => {
      if (isMounted) loadData();
    });
    return () => {
      isMounted = false;
      task.cancel();
    };
  }, [userId]);

  async function loadData() {
    if (!userId) return;
    try {
      const [topicsData, streakData] = await Promise.all([
        getTopics(userId),
        getStreak(userId),
      ]);
      setTopics(topicsData || []);
      setStreak(streakData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [userId]);

  // Build week days (Mon=0 ... Sun=6)
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayIdx = today === 0 ? 6 : today - 1; // convert to Mon-first

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4ADE80" size="large" />
      </View>
    );
  }

  const inProgressTopics = topics.filter(
    (t: any) => (t.user_progress?.[0]?.learned_count ?? 0) > 0
  );
  const newTopics = topics.filter(
    (t: any) => (t.user_progress?.[0]?.learned_count ?? 0) === 0
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Chào mừng bạn đến với lớp học LingoGen!
        </Text>
      </View>

      {/* Streak card */}
      <View style={styles.streakCard}>
        <View style={styles.streakTop}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakCount}>{streak?.current_streak ?? 0}</Text>
              <Text style={styles.streakLabel}>ngày liên tiếp</Text>
            </View>
          </View>
          <Text style={styles.streakSub}>
            {(streak?.current_streak ?? 0) > 0
              ? 'Lớp học mở cửa mỗi ngày, đừng bỏ lỡ nhé!'
              : 'Bắt đầu chuỗi của bạn hôm nay!'}
          </Text>
        </View>

        {/* Days of week */}
        <View style={styles.daysRow}>
          {DAYS.map((day, i) => (
            <View
              key={day}
              style={[
                styles.dayBubble,
                i < todayIdx && styles.dayDone,
                i === todayIdx && styles.dayToday,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  (i <= todayIdx) && styles.dayTextActive,
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Continue learning */}
      {inProgressTopics.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Tiếp tục học</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.topicRow}>
              {inProgressTopics.map((topic: any) => {
                const progress = topic.user_progress?.[0];
                const learned = progress?.learned_count ?? 0;
                const total = topic.total_words ?? 20;
                const pct = total > 0 ? (learned / total) : 0;
                const iconUri = (topic as any).icon_url ?? (topic as any).image_url;

                return (
                  <TouchableOpacity
                    key={topic.id}
                    style={styles.topicCard}
                    onPress={() =>
                      router.push({
                        pathname: '/word-card',
                        params: { topicId: topic.id, topicName: topic.name },
                      })
                    }
                  >
                    <View style={styles.topicIcon}>
                      <TopicIcon topicName={topic.name} imageUri={iconUri} size={22} />
                    </View>
                    <Text style={styles.topicName}>{topic.name}</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {learned}/{total} từ · {topic.cefr_level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </>
      )}

      {topics.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>Chưa có chủ đề nào</Text>
          <Text style={styles.emptySub}>
            Chạy seed-topics.sql trên Supabase hoặc thêm chủ đề mới
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/topic-select')}
          >
            <Text style={styles.emptyBtnText}>+ Thêm chủ đề</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* All topics */}
      {topics.length > 0 && (
      <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {inProgressTopics.length > 0 ? 'Chủ đề mới' : 'Tất cả chủ đề'}
        </Text>
        <TouchableOpacity onPress={() => router.push('/topic-select')}>
          <Text style={styles.addBtn}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topicGrid}>
        {newTopics.map((topic: any) => {
          const iconUri = (topic as any).icon_url ?? (topic as any).image_url;
          return (
            <TouchableOpacity
              key={topic.id}
              style={styles.topicGridCard}
              onPress={() =>
                router.push({
                  pathname: '/word-card',
                  params: { topicId: topic.id, topicName: topic.name },
                })
              }
            >
              <View style={styles.topicGridIcon}>
                <TopicIcon topicName={topic.name} imageUri={iconUri} size={20} />
              </View>
              <Text style={styles.topicGridName}>{topic.name}</Text>
              <Text style={styles.topicGridLevel}>{topic.cefr_level}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 100 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.2, lineHeight: 28 },
  subtitle: { fontSize: 15, color: '#666', marginTop: 4 },

  streakCard: {
    marginHorizontal: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 28,
  },
  streakTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakEmoji: { fontSize: 36 },
  streakCount: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  streakLabel: { fontSize: 12, color: '#666' },
  streakSub: { fontSize: 12, color: '#888', flex: 1, textAlign: 'right', marginLeft: 12 },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDone: { backgroundColor: '#4ADE80' },
  dayToday: { backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#FFF' },
  dayText: { fontSize: 11, fontWeight: '700', color: '#555' },
  dayTextActive: { color: '#000' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginLeft: 20, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: 20 },
  addBtn: { color: '#4ADE80', fontSize: 15, fontWeight: '700' },

  topicRow: { flexDirection: 'row', paddingLeft: 20, paddingRight: 8, gap: 14, marginBottom: 28 },
  topicCard: {
    width: 170,
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  topicIcon: { marginBottom: 10 },
  topicName: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  progressBar: { height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#4ADE80', borderRadius: 2 },
  progressText: { fontSize: 12, color: '#666' },

  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  topicGridCard: {
    width: '47%',
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  topicGridIcon: { marginBottom: 10 },
  topicGridName: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  topicGridLevel: { fontSize: 12, color: '#4ADE80', fontWeight: '600' },

  emptyBox: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
