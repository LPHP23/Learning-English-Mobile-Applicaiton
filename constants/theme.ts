/** Design tokens — dùng chung toàn app */
export const colors = {
  bg: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceAlt: '#222222',
  border: '#2A2A2A',
  primary: '#4ADE80',
  primaryMuted: '#1E2D22',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#666666',
  textDim: '#444444',
  error: '#F87171',
  errorBg: '#2D1E1E',
} as const;

export const spacing = {
  screen: 20,
  cardRadius: 20,
  btnRadius: 16,
} as const;

export const CEFR_COLORS: Record<string, string> = {
  A1: '#4ADE80',
  A2: '#86EFAC',
  B1: '#60A5FA',
  B2: '#93C5FD',
  C1: '#F59E0B',
  C2: '#FCD34D',
};
