import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getColorForKey, palette } from '@/lib/colors';
import { Entry } from '@/types/entry';

interface ScoreBadgeProps {
  score?: number;
  colorKey?: Entry['colorKey'];
}

export const ScoreBadge = memo(({ score, colorKey }: ScoreBadgeProps) => {
  if (score == null) {
    return null;
  }

  const backgroundColor = getColorForKey(colorKey);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.text}>{score}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    backgroundColor: palette.badgeBackground
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5
  }
});
