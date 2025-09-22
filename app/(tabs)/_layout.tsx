import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

const tabTitles = {
  ideas: 'Идеи',
  notes: 'Заметки',
  observations: 'Наблюдения'
} as const;

type TabKey = keyof typeof tabTitles;

const tabScreenOptions = (scheme: 'light' | 'dark' | null | undefined) => ({
  tabBarStyle: {
    backgroundColor: scheme === 'dark' ? '#0F1115' : '#F5F5F4'
  },
  tabBarActiveTintColor: scheme === 'dark' ? '#EDEDED' : '#111111',
  tabBarInactiveTintColor: scheme === 'dark' ? '#7A7A80' : '#7D7D7D',
  headerShown: false
});

export default function TabsLayout() {
  const scheme = useColorScheme();
  const options = useMemo(() => tabScreenOptions(scheme), [scheme]);

  return (
    <Tabs screenOptions={options}>
      {(Object.keys(tabTitles) as TabKey[]).map((key) => (
        <Tabs.Screen key={key} name={key} options={{ title: tabTitles[key] }} />
      ))}
    </Tabs>
  );
}
