// app/word-card.tsx
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase, getWordsByTopic, markWordLearned, markWordForReview, updateStreak } from '../lib/supabase';
import { speakWord } from '../lib/tts';
import { generateWordsForTopic } from '../lib/api';
import {
  getWordCardIndex,
  setWordCardIndex,
  getLastAiGenerationDate,
  setLastAiGenerationDate,
} from '../lib/storage';
import type { Word } from '../types';

const CEFR_COLORS: Record<string, string> = {
  A1: '#4ADE80', A2: '#86EFAC',
  B1: '#60A5FA', B2: '#93C5FD',
  C1: '#F59E0B', C2: '#FCD34D',
};

const INITIAL_GENERATE_COUNT = 60;
const DAILY_GENERATE_COUNT = 12;

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function formatAiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/AI_ENDPOINT/i.test(raw) || /invalid URL/i.test(raw)) {
    return 'AI_ENDPOINT chưa đúng. Hãy đặt đúng URL trong Supabase secrets.';
  }
  if (/AI provider not configured/i.test(raw)) {
    return 'AI chưa cấu hình. Hãy đặt AI_ENDPOINT và AI_API_KEY trong Supabase.';
  }
  const match = raw.match(/Edge function error:\s*(.*)$/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed?.error) return String(parsed.error);
    } catch {
      return match[1];
    }
  }
  return raw;
}

export default function WordCardScreen() {
  const { topicId, topicName } = useLocalSearchParams<{
    topicId: string;
    topicName: string;
  }>();

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (userId && topicId) loadWords();
  }, [userId, topicId]);

  async function loadWords(forceGenerate = false) {
    if (!userId || !topicId) return;
    setLoading(true);
    setAiError(null);
    let data: Word[] = [];
    try {
      const topicLabel = typeof topicName === 'string' ? topicName : '';
      const todayKey = getTodayKey();

      data = (await getWordsByTopic(topicId, userId)) || [];
      const lastGen = getLastAiGenerationDate(userId, topicId);
      const shouldGenerate = forceGenerate || data.length === 0 || lastGen !== todayKey;

      if (shouldGenerate && topicLabel) {
        try {
          const existingSet = new Set(
            data
              .map((w) => w.word?.trim().toLowerCase())
              .filter((w): w is string => !!w)
          );
          const maxOrder = data.reduce(
            (max, w) => Math.max(max, (w as any).cefr_order ?? 0),
            0
          );
          const count = data.length === 0 ? INITIAL_GENERATE_COUNT : DAILY_GENERATE_COUNT;
          const aiWords = await generateWordsForTopic(topicLabel, count);

          const deduped: Array<{
            word: string;
            ipa: string;
            part_of_speech: string;
            cefr_level: string;
            vietnamese_meaning: string;
            example_sentence: string;
          }> = [];
          const seen = new Set<string>();

          for (const raw of aiWords as any[]) {
            const word = typeof raw.word === 'string' ? raw.word.trim() : '';
            const key = word.toLowerCase();
            if (!word || existingSet.has(key) || seen.has(key)) continue;
            seen.add(key);

            const example =
              typeof raw.example_sentence === 'string'
                ? raw.example_sentence
                : Array.isArray(raw.example_sentences)
                ? raw.example_sentences[0] ?? ''
                : '';

            deduped.push({
              word,
              ipa: raw.ipa ?? '',
              part_of_speech: raw.part_of_speech ?? 'n',
              cefr_level: raw.cefr_level ?? 'B1',
              vietnamese_meaning: raw.vietnamese_meaning ?? '',
              example_sentence: example,
            });
          }

          if (deduped.length > 0) {
            const toInsert = deduped.map((w, index) => ({
              ...w,
              topic_id: topicId,
              cefr_order: maxOrder + index + 1,
            }));

            const { error } = await supabase.from('words').insert(toInsert);
            if (error) throw error;

            await supabase
              .from('topics')
              .update({ total_words: data.length + toInsert.length })
              .eq('id', topicId);

            setLastAiGenerationDate(userId, topicId, todayKey);
            data = (await getWordsByTopic(topicId, userId)) || data;
          } else if (data.length > 0) {
            setLastAiGenerationDate(userId, topicId, todayKey);
          }
        } catch (genErr) {
          setAiError(formatAiError(genErr));
        }
      }
    } catch (err) {
      console.error(err);
      setAiError(formatAiError(err));
    } finally {
      setWords(data || []);
      if (data.length > 0) {
        const savedIndex = getWordCardIndex(userId, topicId);
        const clamped = Math.min(savedIndex, data.length - 1);
        setCurrentIndex(clamped);
      } else {
        setCurrentIndex(0);
      }
      setLoading(false);
    }
  }

  function handleRetryGenerate() {
    void loadWords(true);
  }

  useEffect(() => {
    if (!userId || !topicId) return;
    setWordCardIndex(userId, topicId, currentIndex);
  }, [currentIndex, topicId, userId]);

  function flipCard() {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      tension: 10,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  async function handleLearned() {
    if (!userId || !words[currentIndex]) return;
    await markWordLearned(words[currentIndex].id, userId);
    await updateStreak(userId);
    goNext();
  }

  async function handleReviewLater() {
    if (!userId || !words[currentIndex]) return;
    await markWordForReview(words[currentIndex].id, userId);
    goNext();
  }

  function goNext() {
    if (currentIndex >= words.length - 1) {
      Alert.alert('🎉 Hoàn thành!', 'Bạn đã xem hết từ trong bài học này!', [
        { text: 'Quay lại', onPress: () => router.back() },
      ]);
      return;
    }
    setIsFlipped(false);
    flipAnim.setValue(0);
    setCurrentIndex(i => i + 1);
  }

  function goPrev() {
    if (currentIndex <= 0) return;
    setIsFlipped(false);
    flipAnim.setValue(0);
    setCurrentIndex(i => i - 1);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4ADE80" size="large" />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Chưa có từ cho chủ đề này.</Text>
        {aiError ? (
          <Text style={styles.emptySub}>{aiError}</Text>
        ) : (
          <Text style={styles.emptySub}>
            Hãy thử mở lại sau hoặc kiểm tra cấu hình AI.
          </Text>
        )}
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetryGenerate}>
          <Text style={styles.retryBtnText}>Tạo lại từ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const word = words[currentIndex];
  const progress = (currentIndex + 1) / words.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.topicName}>{topicName}</Text>
          <Text style={styles.wordCount}>
            {currentIndex + 1} / {words.length}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Flip card */}
      <View style={styles.cardArea}>
        <TouchableOpacity onPress={flipCard} activeOpacity={0.95}>
          {/* Front */}
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              { transform: [{ rotateY: frontRotate }] },
              isFlipped && styles.cardHidden,
            ]}
          >
            <View style={styles.cefrBadge}>
              <Text
                style={[
                  styles.cefrText,
                  { color: CEFR_COLORS[word.cefr_level] || '#4ADE80' },
                ]}
              >
                {word.cefr_level}
              </Text>
            </View>

            <Text style={styles.wordText}>{word.word}</Text>
            <Text style={styles.ipaText}>{word.ipa}</Text>

            <TouchableOpacity
              onPress={() => speakWord(word.word)}
              style={styles.speakBtn}
            >
              <Text style={styles.speakBtnText}>🔊 Phát âm</Text>
            </TouchableOpacity>

            <Text style={styles.flipHint}>Nhấn để lật thẻ</Text>
          </Animated.View>

          {/* Back */}
          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ rotateY: backRotate }] },
              !isFlipped && styles.cardHidden,
            ]}
          >
            <View style={styles.posTag}>
              <Text style={styles.posText}>{word.part_of_speech}</Text>
            </View>

            <Text style={styles.vietnameseText}>{word.vietnamese_meaning}</Text>

            <View style={styles.exampleBox}>
              <Text style={styles.exampleWord}>"{word.example_sentence}"</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionReview} onPress={handleReviewLater}>
          <Text style={styles.actionReviewText}>🔖 Ôn lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionLearned} onPress={handleLearned}>
          <Text style={styles.actionLearnedText}>✓ Đã nhớ</Text>
        </TouchableOpacity>
      </View>

      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navDisabled]}
          onPress={goPrev}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navBtnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={goNext}>
          <Text style={styles.navBtnText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#E5E7EB', fontSize: 16, marginBottom: 8 },
  emptySub: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginBottom: 12,
  },
  retryBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  backLink: { color: '#4ADE80', fontSize: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#101010',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  backBtnText: { color: '#FFF', fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  topicName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  wordCount: { fontSize: 13, color: '#666', marginTop: 2 },

  progressBar: {
    height: 3,
    backgroundColor: '#0B0B0B',
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 2,
  },

  cardArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, marginVertical: 24 },
  card: {
    backgroundColor: '#0B0B0B',
    borderRadius: 24,
    padding: 32,
    minHeight: 340,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    backfaceVisibility: 'hidden',
  },
  cardFront: { alignItems: 'center' },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardHidden: { opacity: 0 },

  cefrBadge: {
    backgroundColor: '#1E2D22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
    position: 'absolute',
    top: 16,
    left: 16,
  },
  cefrText: { fontSize: 12, fontWeight: '800' },

  wordText: { fontSize: 42, fontWeight: '900', color: '#FFF', letterSpacing: -1, textAlign: 'center' },
  ipaText: { fontSize: 18, color: '#4ADE80', marginTop: 8, fontStyle: 'italic' },

  speakBtn: {
    marginTop: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  speakBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  flipHint: { color: '#444', fontSize: 13, marginTop: 24 },

  posTag: {
    backgroundColor: '#4ADE8022',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  posText: { color: '#4ADE80', fontSize: 13, fontWeight: '700' },
  vietnameseText: { fontSize: 30, fontWeight: '800', color: '#FFF', letterSpacing: -0.5, marginBottom: 20 },
  exampleBox: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4ADE80',
  },
  exampleWord: { color: '#CCC', fontSize: 15, lineHeight: 22, fontStyle: 'italic' },

  actions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  actionReview: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  actionReviewText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  actionLearned: {
    flex: 1,
    backgroundColor: '#4ADE80',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionLearnedText: { color: '#000', fontSize: 15, fontWeight: '700' },

  nav: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 40,
  },
  navBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#111',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  navBtnText: { color: '#FFF', fontSize: 22 },
  navDisabled: { opacity: 0.3 },
});
