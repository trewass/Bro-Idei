import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { useEntriesStore } from '@/store/useEntries';

export default function RootLayout() {
  const scheme = useColorScheme();
  const initialize = useEntriesStore((state) => state.initialize);

  useEffect(() => {
    initialize().catch((error) => {
      console.error('Failed to initialize storage', error);
    });
  }, [initialize]);

  const theme = scheme === 'light' ? DefaultTheme : DarkTheme;

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="entry/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modals/create" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
