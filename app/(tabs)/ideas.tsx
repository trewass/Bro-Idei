import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EntryCard } from '@/components/Card';
import { useEntriesStore } from '@/store/useEntries';
import { palette } from '@/lib/colors';
import { Entry } from '@/types/entry';

const type = 'idea' as const;

export default function IdeasScreen() {
  const router = useRouter();
  const entries = useEntriesStore((state) => state.entriesByType[type]);
  const refreshEntries = useEntriesStore((state) => state.refreshEntries);

  useEffect(() => {
    refreshEntries(type).catch((error) => console.error('Failed to load ideas', error));
  }, [refreshEntries]);

  const openEntry = (entry: Entry) => {
    router.push({ pathname: '/entry/[id]', params: { id: entry.id } });
  };

  const openCreateModal = () => {
    router.push({ pathname: '/modals/create', params: { type } });
  };

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.list}
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EntryCard entry={item} onPress={openEntry} />}
      />
      <Pressable style={styles.fab} onPress={openCreateModal} accessibilityRole="button">
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundDark,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  list: {
    paddingBottom: 96
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E212A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 }
  },
  fabText: {
    color: palette.textLight,
    fontSize: 32,
    lineHeight: 32,
    marginTop: -2
  }
});
