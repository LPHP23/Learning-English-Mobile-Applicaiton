// lib/tts.ts
import * as Speech from 'expo-speech';
import { getUserPrefs } from './storage';

let isSpeaking = false;

export async function speakWord(word: string): Promise<void> {
  if (isSpeaking) {
    Speech.stop();
    isSpeaking = false;
    return;
  }

  const prefs = getUserPrefs();
  if (!prefs.tts_enabled) return;

  isSpeaking = true;

  Speech.speak(word, {
    language: 'en-US',
    rate: prefs.tts_speed,
    pitch: 1.0,
    onDone: () => { isSpeaking = false; },
    onError: () => { isSpeaking = false; },
    onStopped: () => { isSpeaking = false; },
  });
}

export async function speakVietnamese(text: string): Promise<void> {
  if (isSpeaking) {
    Speech.stop();
    isSpeaking = false;
    return;
  }

  isSpeaking = true;

  Speech.speak(text, {
    language: 'vi-VN',
    rate: 0.9,
    onDone: () => { isSpeaking = false; },
    onError: () => { isSpeaking = false; },
  });
}

export function stopSpeaking(): void {
  Speech.stop();
  isSpeaking = false;
}
