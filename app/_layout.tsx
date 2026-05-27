import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { isSupabaseConfigured } from '../lib/config';
import { BOOTSTRAP_STORAGE_KEYS, hydrateStorage, isStorageReady } from '../lib/storage';
import { colors } from '../constants/theme';
import SetupRequired from '../components/SetupRequired';

function AppBackground({ children }: { children: ReactNode }) {
  return (
    <ImageBackground
      source={require('../assets/splash.png')}
      style={styles.appBackground}
      resizeMode="cover"
    >
      <View style={styles.appOverlay}>{children}</View>
    </ImageBackground>
  );
}

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
      <AppBackground>
        <StatusBar style="light" />
        <SetupRequired />
      </AppBackground>
    );
  }

  if (!storageReady) {
    return (
      <AppBackground>
        <View
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <StatusBar style="light" />
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <AuthenticatedRoot />
    </AppBackground>
  );
}

function AuthenticatedRoot() {
  const { supabase } = require('../lib/supabase') as typeof import('../lib/supabase');
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
      card: 'transparent',
    },
  };

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
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="word-card" options={{ presentation: 'modal' }} />
          <Stack.Screen name="topic-select" />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
  },
  appOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
