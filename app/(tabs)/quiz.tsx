// app/(tabs)/quiz.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { addQuizResult } from '../../lib/storage';

interface Question {
  word: string;
  ipa: string;
  correct: string;
  options: string[];
}

// Mock quiz generator (replace with Edge Function call)
function generateMockQuiz(words: any[]): Question[] {
  if (words.length < 4) return [];
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(10, shuffled.length)).map((w, i) => {
    const wrongPool = words
      .filter(x => x.id !== w.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(x => x.vietnamese_meaning);
    const options = [...wrongPool, w.vietnamese_meaning].sort(() => Math.random() - 0.5);
    return {
      word: w.word,
      ipa: w.ipa || '',
      correct: w.vietnamese_meaning,
      options,
    };
  });
}

export default function QuizScreen() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topicId, setTopicId] = useState<string | null>(null);

  useEffect(() => {
    loadQuiz();
  }, []);

  async function loadQuiz() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: words } = await supabase
        .from('words')
        .select('id, word, ipa, vietnamese_meaning, topic_id')
        .limit(50);

      if (!words?.length) {
        setLoading(false);
        return;
      }

      if (words[0]) setTopicId((words[0] as any).topic_id);
      const quiz = generateMockQuiz(words);
      setQuestions(quiz);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(option: string) {
    if (selected) return; // Already answered
    setSelected(option);

    if (option === questions[currentIdx].correct) {
      setScore(s => s + 1);
    }

    // Auto advance after 1.2s
    setTimeout(() => {
      if (currentIdx >= questions.length - 1) {
        finishQuiz(option === questions[currentIdx].correct ? score + 1 : score);
      } else {
        setCurrentIdx(i => i + 1);
        setSelected(null);
      }
    }, 1200);
  }

  function finishQuiz(finalScore: number) {
    setDone(true);
    if (topicId) {
      addQuizResult({
        date: new Date().toISOString(),
        topic_id: topicId,
        score: finalScore,
        total: questions.length,
      });
    }
  }

  function restart() {
    setCurrentIdx(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    loadQuiz();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4ADE80" size="large" />
        <Text style={styles.loadingText}>Đang tạo bài kiểm tra...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>📚</Text>
        <Text style={styles.emptyTitle}>Chưa có từ để ôn tập</Text>
        <Text style={styles.emptySubtitle}>
          Hãy học ít nhất 4 từ từ bất kỳ chủ đề nào!
        </Text>
      </View>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>{pct >= 70 ? '🎉' : '💪'}</Text>
        <Text style={styles.doneTitle}>
          {score}/{questions.length} câu đúng
        </Text>
        <Text style={styles.donePct}>{pct}%</Text>
        <Text style={styles.doneFeedback}>
          {pct >= 90
            ? 'Xuất sắc! Bạn thật giỏi!'
            : pct >= 70
            ? 'Tốt lắm! Tiếp tục cố gắng!'
            : 'Cần ôn luyện thêm. Đừng bỏ cuộc!'}
        </Text>
        <TouchableOpacity style={styles.restartBtn} onPress={restart}>
          <Text style={styles.restartText}>Làm lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = questions[currentIdx];
  const progress = (currentIdx + 1) / questions.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kiểm tra từ vựng</Text>
        <Text style={styles.headerScore}>✓ {score}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIdx + 1}/{questions.length}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>Nghĩa tiếng Việt của từ này là gì?</Text>
        <Text style={styles.questionWord}>"{q.word}"</Text>
        {q.ipa ? <Text style={styles.questionIpa}>{q.ipa}</Text> : null}
      </View>

      {/* Options */}
      <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
        {q.options.map((opt, i) => {
          let style = styles.optionDefault;
          if (selected) {
            if (opt === q.correct) style = styles.optionCorrect;
            else if (opt === selected && opt !== q.correct) style = styles.optionWrong;
          }

          return (
            <TouchableOpacity
              key={i}
              style={[styles.option, style]}
              onPress={() => handleAnswer(opt)}
              disabled={!!selected}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && opt === q.correct ? styles.optionTextCorrect : null,
                  selected && opt === selected && opt !== q.correct
                    ? styles.optionTextWrong
                    : null,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#666', marginTop: 16, fontSize: 15 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { color: '#666', fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  headerScore: { fontSize: 18, fontWeight: '700', color: '#4ADE80' },

  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  progressBar: { flex: 1, height: 6, backgroundColor: '#1A1A1A', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: '#4ADE80', borderRadius: 3 },
  progressText: { color: '#666', fontSize: 13, fontWeight: '600', width: 40 },

  questionCard: {
    marginHorizontal: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  questionLabel: { color: '#666', fontSize: 14, marginBottom: 12 },
  questionWord: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  questionIpa: { fontSize: 16, color: '#4ADE80', marginTop: 6, fontStyle: 'italic' },

  options: { paddingHorizontal: 20, gap: 12, paddingBottom: 100 },
  option: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  optionDefault: { backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' },
  optionCorrect: { backgroundColor: '#1E2D22', borderColor: '#4ADE80' },
  optionWrong: { backgroundColor: '#2D1E1E', borderColor: '#F87171' },
  optionText: { fontSize: 17, color: '#FFF', fontWeight: '600' },
  optionTextCorrect: { color: '#4ADE80' },
  optionTextWrong: { color: '#F87171' },

  doneEmoji: { fontSize: 80, marginBottom: 20 },
  doneTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', marginBottom: 8 },
  donePct: { fontSize: 56, fontWeight: '900', color: '#4ADE80', marginBottom: 16 },
  doneFeedback: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 40 },
  restartBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  restartText: { color: '#000', fontSize: 17, fontWeight: '700' },
});
