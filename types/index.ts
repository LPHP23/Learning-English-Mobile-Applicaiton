// types/index.ts

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Word {
  id: string;
  word: string;
  ipa: string;
  part_of_speech: string; // n, v, adj, adv
  vietnamese_meaning: string;
  example_sentence: string;
  cefr_level: CEFRLevel;
  topic_id: string;
  learned: boolean;
  review_date?: string;
}

export interface Topic {
  id: string;
  name: string;
  emoji: string;
  description: string;
  total_words: number;
  learned_words: number;
  cefr_level: CEFRLevel;
  created_at: string;
}

export interface UserProgress {
  user_id: string;
  topic_id: string;
  learned_count: number;
  total_count: number;
  last_studied: string;
}

export interface QuizQuestion {
  word: Word;
  options: string[]; // 4 Vietnamese options
  correct_index: number;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_study_date: string;
  days_this_week: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

export interface DictionaryEntry {
  word: string;
  ipa: string;
  part_of_speech: string;
  /** Tất cả nghĩa tiếng Việt, nối bằng " • " */
  vietnamese_meaning: string;
  /** Danh sách nghĩa riêng (nếu có nhiều nghĩa) */
  vietnamese_meanings?: string[];
  /** Định nghĩa tiếng Anh (từ Free Dictionary API) */
  english_definition?: string;
  example_sentence: string;
  topics: string[];
  cefr_level: CEFRLevel;
  /** URL phát âm MP3 (Free Dictionary API) */
  audio_url?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  daily_goal: number; // words per day
  notification_time: string; // HH:MM
  created_at: string;
}
