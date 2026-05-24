import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { isSupabaseConfigured } from '../lib/config';
import { BOOTSTRAP_STORAGE_KEYS, hydrateStorage, isStorageReady } from '../lib/storage';
import { colors } from '../constants/theme';
import SetupRequired from '../components/SetupRequired';

export default function RootLayout() {
  const [storageReady, setStorageReady] = useState(isStorageReady());

  useEffect(() => {
    if (storageReady) return;
    let isMounted = true;
    hydrateStorage(BOOTSTRAP_STORAGE_KEYS).then(() => {
      if (isMounted) setStorageReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, [storageReady]);

  const supabaseConfigured = isSupabaseConfigured();

  if (!supabaseConfigured) {
    return (
      <>
        <StatusBar style="light" />
        <SetupRequired />
      </>
    );
  }

  if (!storageReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <StatusBar style="light" />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <AuthenticatedRoot />;
}

function AuthenticatedRoot() {
  const { supabase } = require('../lib/supabase') as typeof import('../lib/supabase');

  const [initialRoute, setInitialRoute] = useState<'(tabs)' | '(auth)' | null>(null);
  const initialRouteRef = useRef<'(tabs)' | '(auth)' | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const route = session ? '(tabs)' : '(auth)';
      initialRouteRef.current = route;
      setInitialRoute(route);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (initialRouteRef.current) {
        router.replace(session ? '/(tabs)' : '/(auth)/login');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="word-card" options={{ presentation: 'modal' }} />
        <Stack.Screen name="topic-select" />
      </Stack>
    </GestureHandlerRootView>
  );
}
