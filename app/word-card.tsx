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
import type { Word } from '../types';

const CEFR_COLORS: Record<string, string> = {
  A1: '#4ADE80', A2: '#86EFAC',
  B1: '#60A5FA', B2: '#93C5FD',
  C1: '#F59E0B', C2: '#FCD34D',
};

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

  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (userId && topicId) loadWords();
  }, [userId, topicId]);

  async function loadWords() {
    try {
      const data = await getWordsByTopic(topicId, userId!);
      setWords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
        <Text style={styles.emptyText}>Không có từ nào.</Text>
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
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  center: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16, marginBottom: 16 },
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
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { color: '#FFF', fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  topicName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  wordCount: { fontSize: 13, color: '#666', marginTop: 2 },

  progressBar: {
    height: 3,
    backgroundColor: '#1A1A1A',
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
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 32,
    minHeight: 340,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
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
    backgroundColor: '#222',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    backgroundColor: '#222',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4ADE80',
  },
  exampleWord: { color: '#CCC', fontSize: 15, lineHeight: 22, fontStyle: 'italic' },

  actions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  actionReview: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
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
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  navBtnText: { color: '#FFF', fontSize: 22 },
  navDisabled: { opacity: 0.3 },
});
