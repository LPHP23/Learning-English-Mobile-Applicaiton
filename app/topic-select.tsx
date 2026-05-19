// app/topic-select.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { generateWordsForTopic } from '../lib/api';
import { getBuiltinTopic } from '../lib/builtinTopics';

const PRESET_TOPICS = [
  { name: 'Hospital', emoji: '🏥', level: 'Intermediate' },
  { name: 'Airport', emoji: '✈️', level: 'Beginner' },
  { name: 'Restaurant', emoji: '🍽️', level: 'Beginner' },
  { name: 'Office', emoji: '💼', level: 'Intermediate' },
  { name: 'Shopping', emoji: '🛍️', level: 'Beginner' },
  { name: 'Technology', emoji: '💻', level: 'Advanced' },
  { name: 'Nature', emoji: '🌿', level: 'Beginner' },
  { name: 'Sports', emoji: '⚽', level: 'Intermediate' },
  { name: 'Travel', emoji: '🗺️', level: 'Intermediate' },
  { name: 'Food', emoji: '🍜', level: 'Beginner' },
  { name: 'Health', emoji: '💊', level: 'Intermediate' },
  { name: 'Business', emoji: '📊', level: 'Advanced' },
  { name: 'Education', emoji: '📚', level: 'Intermediate' },
  { name: 'Music', emoji: '🎵', level: 'Beginner' },
  { name: 'Art', emoji: '🎨', level: 'Intermediate' },
  { name: 'Science', emoji: '🔬', level: 'Advanced' },
];

export default function TopicSelectScreen() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleTopic(name: string) {
    setSelectedTopics(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  }

  async function handleAddTopics() {
    if (selectedTopics.length === 0) {
      Alert.alert('Chọn ít nhất 1 chủ đề');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      for (const topicName of selectedTopics) {
        const preset = PRESET_TOPICS.find((t) => t.name === topicName)!;

        // Bỏ qua nếu chủ đề đã tồn tại
        const { data: existing } = await supabase
          .from('topics')
          .select('id')
          .ilike('name', topicName)
          .maybeSingle();

        if (existing) continue;

        const builtin = getBuiltinTopic(topicName);
        const wordCount = builtin?.words.length ?? 60;

        const { data: topic, error: topicErr } = await supabase
          .from('topics')
          .insert({
            name: preset.name,
            emoji: preset.emoji,
            description: builtin?.description ?? `Vocabulary for ${preset.name.toLowerCase()}`,
            total_words: wordCount,
            cefr_level:
              preset.level === 'Beginner'
                ? 'A2'
                : preset.level === 'Intermediate'
                  ? 'B2'
                  : 'C1',
          })
          .select()
          .single();

        if (topicErr) throw topicErr;

        let wordsToInsert: Record<string, unknown>[] = [];

        try {
          const aiWords = await generateWordsForTopic(topicName, 60);
          wordsToInsert = aiWords.map((w) => ({ ...w, topic_id: topic.id }));
        } catch {
          if (builtin) {
            wordsToInsert = builtin.words.map((w) => ({
              ...w,
              topic_id: topic.id,
            }));
          }
        }

        if (wordsToInsert.length > 0) {
          const { error: wordsErr } = await supabase
            .from('words')
            .insert(wordsToInsert);
          if (wordsErr) throw wordsErr;

          await supabase
            .from('topics')
            .update({ total_words: wordsToInsert.length })
            .eq('id', topic.id);
        }
      }

      Alert.alert('✅ Đã thêm chủ đề!', 'Bắt đầu học ngay nhé!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Chọn chủ đề</Text>
        <Text style={styles.subtitle}>Claude AI sẽ tạo từ vựng cho bạn</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {PRESET_TOPICS.map(topic => {
          const selected = selectedTopics.includes(topic.name);
          return (
            <TouchableOpacity
              key={topic.name}
              style={[styles.topicCard, selected && styles.topicCardSelected]}
              onPress={() => toggleTopic(topic.name)}
            >
              {selected && <Text style={styles.checkmark}>✓</Text>}
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              <Text style={[styles.topicName, selected && styles.topicNameSelected]}>
                {topic.name}
              </Text>
              <Text style={styles.topicLevel}>{topic.level}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* CTA */}
      {selectedTopics.length > 0 && (
        <View style={styles.cta}>
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleAddTopics}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.ctaBtnText}>
                Thêm {selectedTopics.length} chủ đề ✨
              </Text>
            )}
          </TouchableOpacity>
          {loading && (
            <Text style={styles.loadingNote}>
              Claude đang tạo từ vựng... (30-60s)
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtnText: { color: '#FFF', fontSize: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 6 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 140,
    paddingTop: 8,
  },
  topicCard: {
    width: '30%',
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    position: 'relative',
  },
  topicCardSelected: {
    borderColor: '#4ADE80',
    backgroundColor: '#1E2D22',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 10,
    color: '#4ADE80',
    fontWeight: '900',
    fontSize: 14,
  },
  topicEmoji: { fontSize: 28, marginBottom: 8 },
  topicName: { fontSize: 13, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  topicNameSelected: { color: '#4ADE80' },
  topicLevel: { fontSize: 11, color: '#555', marginTop: 4 },

  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: '#0F0F0F',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  ctaBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: '#000', fontSize: 17, fontWeight: '800' },
  loadingNote: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 10 },
});
