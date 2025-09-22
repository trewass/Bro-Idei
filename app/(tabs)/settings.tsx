import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Surface, Text, useTheme, List, Divider } from 'react-native-paper';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Surface style={styles.surface} elevation={1}>
        <List.Section>
          <List.Subheader>Основные настройки</List.Subheader>
          <List.Item
            title="Тема приложения"
            description="Светлая / Темная / Системная"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          />
          <Divider />
          <List.Item
            title="Уведомления"
            description="Настройка напоминаний"
            left={(props) => <List.Icon {...props} icon="bell" />}
          />
          <Divider />
          <List.Item
            title="Экспорт данных"
            description="Сохранить все карточки"
            left={(props) => <List.Icon {...props} icon="download" />}
          />
        </List.Section>
        
        <List.Section>
          <List.Subheader>О приложении</List.Subheader>
          <List.Item
            title="Версия"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </List.Section>
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
    borderRadius: 12,
    overflow: 'hidden',
  },
});