import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { ThemeProvider } from '@components/ThemeProvider';
import { getTheme } from '@utils/theme';
import { useThemeStore } from '@store/themeStore';
import { initDatabase } from '@services/database';

export default function RootLayout() {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        await initDatabase();
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initDb();
  }, []);

  if (dbError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ошибка инициализации базы данных</Text>
        <Text style={styles.errorDetails}>{dbError}</Text>
      </View>
    );
  }

  if (!isDbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Инициализация...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <PaperProvider theme={theme}>
        <Stack>
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen
            name="card/[id]"
            options={{
              presentation: 'modal',
              headerTitle: 'Детали карточки'
            }}
          />
        </Stack>
      </PaperProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d32f2f',
  },
  errorDetails: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
});