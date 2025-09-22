import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme, Chip } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';

export default function CardDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Surface style={styles.surface} elevation={2}>
        <Text variant="titleLarge" style={styles.title}>
          Карточка страха #{id}
        </Text>
        
        <View style={styles.chipContainer}>
          <Chip icon="clock-outline" mode="outlined">
            В процессе
          </Chip>
        </View>
        
        <Text variant="bodyLarge" style={styles.description}>
          Здесь будет подробное описание вашего страха и план работы с ним.
        </Text>
        
        <Text variant="bodyMedium" style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
          Это модальное окно для просмотра и редактирования деталей карточки.
        </Text>
      </Surface>
      
      <Surface style={[styles.surface, styles.sectionSurface]} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Прогресс работы
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Здесь будет отображаться ваш прогресс в работе со страхом.
        </Text>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  surface: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionSurface: {
    marginBottom: 0,
  },
  title: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  description: {
    marginBottom: 8,
  },
  helperText: {
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: 8,
  },
});