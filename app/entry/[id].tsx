import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Entry, Link } from '@/types/entry';
import { useEntriesStore } from '@/store/useEntries';
import { ColorRibbon } from '@/components/ColorRibbon';
import { palette } from '@/lib/colors';
import { ScoreBadge } from '@/components/ScoreBadge';
import { deleteLink, listLinksForEntry, createLink } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const tabs = [
  { label: 'Анализ', value: 'analysis' },
  { label: 'Текст', value: 'transcript' },
  { label: 'Связи', value: 'links' }
] as const;

type TabValue = (typeof tabs)[number]['value'];

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('analysis');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);

  const refreshEntry = useEntriesStore((state) => state.refreshEntry);
  const updateEntry = useEntriesStore((state) => state.updateEntry);
  const entriesByType = useEntriesStore((state) => state.entriesByType);

  const allEntries = useMemo(() => {
    return (Object.values(entriesByType) as Entry[][]).flat();
  }, [entriesByType]);

  useEffect(() => {
    if (!id) {
      return;
    }
    setLoading(true);
    refreshEntry(id)
      .then((result) => {
        setEntry(result);
        if (result) {
          return listLinksForEntry(result.id).then((items) => setLinks(items));
        }
        return undefined;
      })
      .finally(() => setLoading(false));
  }, [id, refreshEntry]);

  const updateField = async (updates: Partial<Entry>) => {
    if (!entry) {
      return;
    }
    const updated = await updateEntry(entry.id, updates);
    if (updated) {
      setEntry(updated);
    }
  };

  const changeScore = (delta: number) => {
    if (!entry) {
      return;
    }
    const nextScore = Math.min(10, Math.max(0, (entry.score ?? 0) + delta));
    updateField({ score: nextScore });
  };

  const openLinkPicker = () => {
    setLinkPickerOpen(true);
  };

  const closeLinkPicker = () => {
    setLinkPickerOpen(false);
  };

  const addLink = async (target: Entry) => {
    if (!entry || target.id === entry.id) {
      return;
    }
    const link: Link = {
      id: uuidv4(),
      fromId: entry.id,
      toId: target.id,
      kind: 'related',
      createdAt: new Date().toISOString()
    };
    await createLink(link);
    setLinks((prev) => [link, ...prev]);
    closeLinkPicker();
  };

  const removeLink = async (linkId: string) => {
    await deleteLink(linkId);
    setLinks((prev) => prev.filter((link) => link.id !== linkId));
  };

  if (!id) {
    return null;
  }

  if (loading && !entry) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={palette.textLight} />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Запись не найдена</Text>
      </View>
    );
  }

  const linkedItems = links
    .map((link) => {
      const otherId = link.fromId === entry.id ? link.toId : link.fromId;
      const linked = allEntries.find((item) => item.id === otherId);
      return linked ? { link, entry: linked } : null;
    })
    .filter(Boolean) as { link: Link; entry: Entry }[];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Назад</Text>
        </Pressable>
        <View style={styles.card}>
          <ColorRibbon colorKey={entry.colorKey} />
          <View style={styles.cardContent}>
            <TextInput
              value={entry.title}
              onChangeText={(text) => setEntry((prev) => (prev ? { ...prev, title: text } : prev))}
              onBlur={() => updateField({ title: entry.title })}
              style={styles.title}
              placeholder="Название"
              placeholderTextColor="#727684"
            />
            <View style={styles.scoreRow}>
              <Pressable onPress={() => changeScore(-1)} style={styles.scoreButton}>
                <Text style={styles.scoreButtonText}>-</Text>
              </Pressable>
              <ScoreBadge score={entry.score} colorKey={entry.colorKey} />
              <Pressable onPress={() => changeScore(1)} style={styles.scoreButton}>
                <Text style={styles.scoreButtonText}>+</Text>
              </Pressable>
            </View>
            <TextInput
              value={entry.description ?? ''}
              onChangeText={(text) => setEntry((prev) => (prev ? { ...prev, description: text } : prev))}
              onBlur={() => updateField({ description: entry.description })}
              style={styles.description}
              placeholder="Описание"
              placeholderTextColor="#727684"
              multiline
            />
          </View>
        </View>

        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tabButton, activeTab === tab.value && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'analysis' && entry.analysis ? (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Саммари</Text>
            <Text style={styles.sectionText}>{entry.analysis.summary}</Text>
            <Text style={styles.sectionTitle}>Вердикт</Text>
            <Text style={styles.sectionText}>{entry.analysis.verdict}</Text>
            <Text style={styles.sectionTitle}>Аргументы</Text>
            <Text style={styles.sectionText}>{entry.analysis.reasoning}</Text>
            {entry.analysis.suggestions?.length ? (
              <View style={styles.suggestions}>
                <Text style={styles.sectionTitle}>Предложения</Text>
                {entry.analysis.suggestions.map((item) => (
                  <Text style={styles.sectionText} key={item}>
                    • {item}
                  </Text>
                ))}
              </View>
            ) : null}
            {entry.analysis.marketNotes ? (
              <View style={styles.suggestions}>
                <Text style={styles.sectionTitle}>Рынок</Text>
                <Text style={styles.sectionText}>{entry.analysis.marketNotes}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'transcript' ? (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionText}>{entry.transcript ?? 'Транскрипт не получен'}</Text>
          </View>
        ) : null}

        {activeTab === 'links' ? (
          <View style={styles.sectionBox}>
            <View style={styles.linksHeader}>
              <Text style={styles.sectionTitle}>Связанные записи</Text>
              <Pressable style={styles.addLinkButton} onPress={openLinkPicker}>
                <Text style={styles.addLinkText}>+ связь</Text>
              </Pressable>
            </View>
            {linkedItems.length === 0 ? (
              <Text style={styles.sectionText}>Пока нет связей</Text>
            ) : (
              linkedItems.map(({ link, entry: linkedEntry }) => (
                <View key={link.id} style={styles.linkRow}>
                  <View>
                    <Text style={styles.linkTitle}>{linkedEntry.title}</Text>
                    <Text style={styles.linkSubtitle}>{linkedEntry.type}</Text>
                  </View>
                  <Pressable onPress={() => removeLink(link.id)}>
                    <Text style={styles.removeLink}>Удалить</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={linkPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Выберите карточку</Text>
            <ScrollView style={styles.modalList}>
              {allEntries
                .filter((candidate) => candidate.id !== entry.id)
                .map((candidate) => (
                  <Pressable
                    key={candidate.id}
                    style={styles.modalItem}
                    onPress={() => addLink(candidate)}
                  >
                    <Text style={styles.modalItemTitle}>{candidate.title}</Text>
                    <Text style={styles.modalItemSubtitle}>{candidate.type}</Text>
                  </Pressable>
                ))}
            </ScrollView>
            <Pressable style={styles.modalClose} onPress={closeLinkPicker}>
              <Text style={styles.modalCloseText}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.backgroundDark
  },
  content: {
    padding: 24,
    gap: 24
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.backgroundDark
  },
  emptyText: {
    color: palette.textLight
  },
  backButton: {
    alignSelf: 'flex-start'
  },
  backText: {
    color: '#7F8496'
  },
  card: {
    backgroundColor: palette.cardDark,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 }
  },
  cardContent: {
    padding: 20,
    gap: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textLight
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  scoreButton: {
    backgroundColor: '#1E212B',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreButtonText: {
    color: palette.textLight,
    fontSize: 20,
    marginTop: -2
  },
  description: {
    minHeight: 100,
    color: palette.textLight,
    backgroundColor: '#141720',
    borderRadius: 16,
    padding: 16
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2E3B',
    alignItems: 'center'
  },
  tabButtonActive: {
    backgroundColor: '#222633',
    borderColor: '#3A3F50'
  },
  tabText: {
    color: '#7A8094'
  },
  tabTextActive: {
    color: palette.textLight,
    fontWeight: '600'
  },
  sectionBox: {
    backgroundColor: '#171B27',
    borderRadius: 18,
    padding: 20,
    gap: 12
  },
  sectionTitle: {
    color: '#A1A6B8',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  sectionText: {
    color: palette.textLight,
    lineHeight: 20
  },
  suggestions: {
    gap: 6
  },
  linksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  addLinkButton: {
    backgroundColor: '#2F3547',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12
  },
  addLinkText: {
    color: palette.textLight,
    fontWeight: '600'
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2E3B'
  },
  linkTitle: {
    color: palette.textLight,
    fontWeight: '600'
  },
  linkSubtitle: {
    color: '#7A7F91',
    textTransform: 'capitalize'
  },
  removeLink: {
    color: '#E26B6B'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24
  },
  modalContainer: {
    backgroundColor: '#1C1F2B',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    maxHeight: '80%'
  },
  modalTitle: {
    color: palette.textLight,
    fontSize: 18,
    fontWeight: '600'
  },
  modalList: {
    maxHeight: 320
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2E3B'
  },
  modalItemTitle: {
    color: palette.textLight
  },
  modalItemSubtitle: {
    color: '#7A7F91'
  },
  modalClose: {
    alignSelf: 'flex-end'
  },
  modalCloseText: {
    color: '#9DA1B3'
  }
});
