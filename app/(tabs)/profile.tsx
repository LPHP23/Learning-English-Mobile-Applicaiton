// app/(tabs)/profile.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase, getStreak } from '../../lib/supabase';
import {
  getUserPrefs,
  setUserPrefs,
  getQuizHistory,
  getAvatarUri,
  setAvatarUri,
} from '../../lib/storage';
import * as ImagePicker from 'expo-image-picker';
import type { User } from '../../types';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [avatarUri, setAvatarUriState] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);
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

      const mergedProfile = profile || {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'Người dùng',
        daily_goal: 20,
        notification_time: '08:00',
        created_at: authUser.created_at,
      };

      setUser(mergedProfile);
      setNameDraft(mergedProfile.full_name || '');
      setAvatarUriState(getAvatarUri(authUser.id));

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

  async function handlePickAvatar() {
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập ảnh', 'Vui lòng cho phép truy cập thư viện ảnh.');
      return;
    }

    setPickingAvatar(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        setAvatarUriState(uri);
        setAvatarUri(user.id, uri);
      }
    } finally {
      setPickingAvatar(false);
    }
  }

  async function handleSaveName() {
    if (!user) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      Alert.alert('Tên không hợp lệ', 'Vui lòng nhập tên của bạn.');
      return;
    }
    if (trimmed === user.full_name) {
      setEditingName(false);
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', user.id);
      if (error) throw error;

      await supabase.auth.updateUser({ data: { full_name: trimmed } });
      setUser({ ...user, full_name: trimmed });
      setEditingName(false);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Không thể cập nhật tên.');
    } finally {
      setSavingProfile(false);
    }
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
        <TouchableOpacity
          style={styles.avatar}
          onPress={handlePickAvatar}
          disabled={pickingAvatar}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickAvatar} disabled={pickingAvatar}>
          <Text style={styles.avatarHint}>
            {pickingAvatar ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}
          </Text>
        </TouchableOpacity>
        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Nhập tên của bạn"
              placeholderTextColor="#6B7280"
            />
            <View style={styles.nameActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveName}
                disabled={savingProfile}
              >
                <Text style={styles.saveBtnText}>
                  {savingProfile ? 'Đang lưu...' : 'Lưu'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setEditingName(false);
                  setNameDraft(user?.full_name ?? '');
                }}
                disabled={savingProfile}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user?.full_name}</Text>
            <TouchableOpacity onPress={() => setEditingName(true)}>
              <Text style={styles.editNameText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          </View>
        )}
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
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 100 },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },

  avatarSection: { alignItems: 'center', paddingTop: 70, paddingBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: { fontSize: 34, fontWeight: '900', color: '#000' },
  avatarHint: { color: '#94A3B8', fontSize: 13, marginBottom: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editNameText: { color: '#4ADE80', fontSize: 13, fontWeight: '700' },
  nameEditRow: { width: '100%', marginTop: 6 },
  nameInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    color: '#FFF',
    fontSize: 15,
    textAlign: 'center',
  },
  nameActions: { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'center' },
  saveBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cancelBtnText: { color: '#E5E7EB', fontWeight: '700', fontSize: 13 },
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
