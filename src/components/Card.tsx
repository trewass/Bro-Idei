import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Entry } from '@/types/entry';
import { ColorRibbon } from './ColorRibbon';
import { ScoreBadge } from './ScoreBadge';
import { truncate } from '@/utils/format';
import { palette } from '@/lib/colors';
import { Mic, Link2, Cloud, RefreshCcw } from 'lucide-react-native';

interface EntryCardProps {
  entry: Entry;
  onPress?: (entry: Entry) => void;
}

const statusIcons = [
  {
    key: 'audio',
    check: (entry: Entry) => Boolean(entry.audioPath),
    icon: Mic
  },
  {
    key: 'linked',
    check: (entry: Entry) => Boolean(entry.analysis),
    icon: Link2
  },
  {
    key: 'synced',
    check: (entry: Entry) => Boolean(entry.remoteId && !entry.dirty),
    icon: Cloud
  },
  {
    key: 'dirty',
    check: (entry: Entry) => Boolean(entry.dirty),
    icon: RefreshCcw
  }
] as const;

export const EntryCard = memo(({ entry, onPress }: EntryCardProps) => {
  return (
    <Pressable style={styles.container} onPress={() => onPress?.(entry)}>
      <ColorRibbon colorKey={entry.colorKey} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {entry.title}
          </Text>
          <ScoreBadge score={entry.score} colorKey={entry.colorKey} />
        </View>
        {entry.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {truncate(entry.description, 120)}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.date}>{new Date(entry.updatedAt).toLocaleDateString()}</Text>
          <View style={styles.iconRow}>
            {statusIcons.map(({ key, check, icon: Icon }) =>
              check(entry) ? <Icon key={key} size={16} color="#B8BBC6" /> : null
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.cardDark,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  content: {
    padding: 16,
    gap: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    color: palette.textLight,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    paddingRight: 12
  },
  description: {
    color: '#B8BBC6',
    fontSize: 14,
    lineHeight: 20
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  date: {
    color: '#7A7F8C',
    fontSize: 12
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8
  }
});
