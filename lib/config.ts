/** Kiểm tra biến môi trường bắt buộc khi khởi động app */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || url.includes('your-project')) {
    throw new Error(
      'Thiếu EXPO_PUBLIC_SUPABASE_URL. Xem SETUP.md — Bước 2.'
    );
  }
  if (!anonKey || anonKey.includes('your-anon-key')) {
    throw new Error(
      'Thiếu EXPO_PUBLIC_SUPABASE_ANON_KEY. Xem SETUP.md — Bước 2.'
    );
  }

  return { url, anonKey };
}

export const isSupabaseConfigured = (): boolean => {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
};
