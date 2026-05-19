import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../constants/theme';

export default function SetupRequired() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.emoji}>⚙️</Text>
      <Text style={styles.title}>Chưa cấu hình Supabase</Text>
      <Text style={styles.desc}>
        App cần kết nối Supabase để đăng nhập và lưu tiến độ học.
      </Text>

      <View style={styles.steps}>
        <Text style={styles.step}>1. Tạo project tại supabase.com</Text>
        <Text style={styles.step}>2. Chạy SQL: schema.sql → seed-vietphrase.sql → seed-topics.sql</Text>
        <Text style={styles.step}>3. Copy URL + anon key vào file .env</Text>
        <Text style={styles.step}>4. Chạy lại: npx expo start -c</Text>
      </View>

      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>.env</Text>
        <Text style={styles.code}>
          EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co{'\n'}
          EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
        </Text>
      </View>

      <Text style={styles.hint}>Chi tiết: SETUP.md trong project</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    paddingTop: 80,
  },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  desc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  steps: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    marginBottom: 20,
  },
  step: { fontSize: 14, color: colors.text, lineHeight: 21 },
  codeBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeLabel: { color: colors.primary, fontWeight: '700', marginBottom: 8 },
  code: { color: '#AAA', fontSize: 12, fontFamily: 'Menlo', lineHeight: 18 },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
