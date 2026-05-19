// app/(tabs)/profile.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase, getStreak } from '../../lib/supabase';
import { getUserPrefs, setUserPrefs, getQuizHistory } from '../../lib/storage';
import type { User } from '../../types';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const quizHistory = getQuizHistory();

  useEffect(() => {
    loadProfile();
    const prefs = getUserPrefs();
    setTtsEnabled(prefs.tts_enabled);
  }, []);

  async function loadProfile() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(profile || {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'Người dùng',
        daily_goal: 20,
        notification_time: '08:00',
        created_at: authUser.created_at,
      });

      const streakData = await getStreak(authUser.id);
      setStreak(streakData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  }

  function handleTtsToggle(val: boolean) {
    setTtsEnabled(val);
    setUserPrefs({ tts_enabled: val });
  }

  const avgScore =
    quizHistory.length > 0
      ? Math.round(
          (quizHistory.reduce((acc, r) => acc + r.score / r.total, 0) /
            quizHistory.length) *
            100
        )
      : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4ADE80" size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.full_name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak?.current_streak ?? 0}</Text>
          <Text style={styles.statLabel}>🔥 Chuỗi ngày</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak?.longest_streak ?? 0}</Text>
          <Text style={styles.statLabel}>🏆 Cao nhất</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgScore}%</Text>
          <Text style={styles.statLabel}>✏️ TB quiz</Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Phát âm tự động</Text>
            <Text style={styles.settingDesc}>Đọc từ khi mở thẻ</Text>
          </View>
          <Switch
            value={ttsEnabled}
            onValueChange={handleTtsToggle}
            trackColor={{ false: '#2A2A2A', true: '#4ADE8066' }}
            thumbColor={ttsEnabled ? '#4ADE80' : '#444'}
          />
        </View>
      </View>

      {/* Quiz history */}
      {quizHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử quiz</Text>
          {quizHistory.slice(0, 5).map((r, i) => (
            <View key={i} style={styles.historyRow}>
              <Text style={styles.historyDate}>
                {new Date(r.date).toLocaleDateString('vi-VN')}
              </Text>
              <Text style={styles.historyScore}>
                {r.score}/{r.total} —{' '}
                <Text style={{ color: r.score / r.total >= 0.7 ? '#4ADE80' : '#F87171' }}>
                  {Math.round((r.score / r.total) * 100)}%
                </Text>
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  content: { paddingBottom: 100 },
  center: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' },

  avatarSection: { alignItems: 'center', paddingTop: 70, paddingBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 34, fontWeight: '900', color: '#000' },
  userName: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  userEmail: { fontSize: 14, color: '#666', marginTop: 4 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statValue: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center' },

  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 16 },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  settingDesc: { fontSize: 13, color: '#666', marginTop: 2 },

  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  historyDate: { color: '#888', fontSize: 14 },
  historyScore: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  logoutBtn: {
    marginHorizontal: 20,
    backgroundColor: '#2D1E1E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8717133',
  },
  logoutText: { color: '#F87171', fontSize: 16, fontWeight: '700' },
});
