// app/(tabs)/dictionary.tsx
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import { searchDictionary } from '../../lib/api';
import { speakWord } from '../../lib/tts';
import type { DictionaryEntry } from '../../types';

export default function DictionaryScreen() {
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState<'en-vi' | 'vi-en'>('en-vi');
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const data = await searchDictionary(query.trim(), direction);
      if (data) {
        setResult(data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [query, direction]);

  const CEFR_COLOR: Record<string, string> = {
    A1: '#4ADE80', A2: '#86EFAC',
    B1: '#60A5FA', B2: '#93C5FD',
    C1: '#F59E0B', C2: '#FCD34D',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Từ điển</Text>
        <Text style={styles.subtitle}>Tra từ Anh ↔ Việt</Text>
      </View>

      {/* Direction toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, direction === 'en-vi' && styles.toggleActive]}
          onPress={() => { setDirection('en-vi'); setResult(null); setNotFound(false); }}
        >
          <Text style={[styles.toggleText, direction === 'en-vi' && styles.toggleTextActive]}>
            EN → VI
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, direction === 'vi-en' && styles.toggleActive]}
          onPress={() => { setDirection('vi-en'); setResult(null); setNotFound(false); }}
        >
          <Text style={[styles.toggleText, direction === 'vi-en' && styles.toggleTextActive]}>
            VI → EN
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={direction === 'en-vi' ? 'Nhập từ tiếng Anh...' : 'Nhập từ tiếng Việt...'}
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.results}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#4ADE80" />
          </View>
        )}

        {notFound && !loading && (
          <View style={styles.notFoundBox}>
            <Text style={styles.notFoundEmoji}>🤷</Text>
            <Text style={styles.notFoundText}>Không tìm thấy "{query}"</Text>
            <Text style={styles.notFoundSub}>Thử tìm từ khác hoặc kiểm tra chính tả</Text>
          </View>
        )}

        {result && !loading && (
          <View style={styles.resultCard}>
            {/* Word + IPA */}
            <View style={styles.resultTop}>
              <View style={styles.resultWordRow}>
                <Text style={styles.resultWord}>{result.word}</Text>
                <TouchableOpacity onPress={() => speakWord(result.word)}>
                  <Text style={styles.speakIcon}>🔊</Text>
                </TouchableOpacity>
              </View>
              {result.ipa ? (
                <Text style={styles.resultIpa}>{result.ipa}</Text>
              ) : null}
            </View>

            {/* Part of speech + Vietnamese meanings */}
            <View style={styles.resultMeaning}>
              <View style={styles.posTag}>
                <Text style={styles.posText}>{result.part_of_speech}</Text>
              </View>
              <View style={styles.meaningCol}>
                {(result.vietnamese_meanings?.length
                  ? result.vietnamese_meanings
                  : [result.vietnamese_meaning]
                ).map((m, i) => (
                  <Text key={i} style={styles.meaningText}>
                    {result.vietnamese_meanings && result.vietnamese_meanings.length > 1
                      ? `${i + 1}. ${m}`
                      : m}
                  </Text>
                ))}
              </View>
            </View>

            {/* English definition */}
            {result.english_definition ? (
              <View style={styles.enDefBox}>
                <Text style={styles.enDefLabel}>English</Text>
                <Text style={styles.enDefText}>{result.english_definition}</Text>
              </View>
            ) : null}

            {/* Example */}
            {result.example_sentence ? (
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>Ví dụ</Text>
                <Text style={styles.exampleText}>"{result.example_sentence}"</Text>
              </View>
            ) : null}

            {/* Tags */}
            <View style={styles.tagsRow}>
              {result.topics?.map(t => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
              <View style={[styles.tag, styles.cefrTag]}>
                <Text style={[styles.tagText, { color: CEFR_COLOR[result.cefr_level] || '#4ADE80' }]}>
                  {result.cefr_level}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick tips when empty */}
        {!result && !loading && !notFound && (
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Mẹo tra từ</Text>
            {['hospital', 'fever', 'airport', 'passport'].map(w => (
              <TouchableOpacity
                key={w}
                style={styles.tipChip}
                onPress={() => { setQuery(w); }}
              >
                <Text style={styles.tipChipText}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },

  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: { flex: 1, borderRadius: 11, paddingVertical: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: '#4ADE80' },
  toggleText: { color: '#666', fontWeight: '700', fontSize: 14 },
  toggleTextActive: { color: '#000' },

  searchRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 20 },
  searchInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFF',
  },
  searchBtn: {
    backgroundColor: '#4ADE80',
    borderRadius: 14,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { fontSize: 20 },

  results: { flex: 1, paddingHorizontal: 20 },

  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  notFoundBox: { paddingVertical: 60, alignItems: 'center' },
  notFoundEmoji: { fontSize: 48, marginBottom: 16 },
  notFoundText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  notFoundSub: { color: '#666', fontSize: 14, marginTop: 6 },

  resultCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 18,
  },
  resultTop: {},
  resultWordRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  resultWord: { fontSize: 34, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  speakIcon: { fontSize: 24 },
  resultIpa: { fontSize: 16, color: '#4ADE80', fontStyle: 'italic' },

  resultMeaning: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  posTag: {
    backgroundColor: '#4ADE8022',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  posText: { color: '#4ADE80', fontSize: 12, fontWeight: '700' },
  meaningCol: { flex: 1, gap: 6 },
  meaningText: { fontSize: 20, color: '#FFF', fontWeight: '700', lineHeight: 28 },
  enDefBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  enDefLabel: { color: '#666', fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  enDefText: { color: '#AAA', fontSize: 14, lineHeight: 21 },

  exampleBox: {
    backgroundColor: '#222',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4ADE80',
  },
  exampleLabel: { color: '#4ADE80', fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  exampleText: { color: '#CCC', fontSize: 14, lineHeight: 21, fontStyle: 'italic' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  cefrTag: { backgroundColor: '#1E2D22' },
  tagText: { color: '#888', fontSize: 12, fontWeight: '600' },

  tips: { paddingTop: 20 },
  tipsTitle: { color: '#444', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  tipChip: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tipChipText: { color: '#888', fontSize: 15 },
});
