import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { getColorForKey } from '@/lib/colors';
import { Entry } from '@/types/entry';

interface ColorRibbonProps {
  colorKey?: Entry['colorKey'];
}

export const ColorRibbon = memo(({ colorKey }: ColorRibbonProps) => {
  const backgroundColor = getColorForKey(colorKey);

  return <View style={[styles.ribbon, { backgroundColor }]} />;
});

const styles = StyleSheet.create({
  ribbon: {
    height: 6,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    opacity: 0.85
  }
});
