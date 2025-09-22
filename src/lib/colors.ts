import { Entry } from '@/types/entry';

export const palette = {
  backgroundDark: '#0F1115',
  backgroundLight: '#F5F5F4',
  cardDark: '#171A21',
  cardLight: '#FFFFFF',
  textLight: '#EAEAEA',
  textDark: '#111111',
  mutedRed: '#7A2E2E',
  brick: '#8A4B3A',
  olive: '#5F6A3D',
  moss: '#3F6B4E',
  deepTeal: '#2E6E68',
  badgeBackground: '#2B2D33',
  overlay: 'rgba(12,14,18,0.7)'
};

type ScoreBand = {
  min: number;
  max: number;
  colorKey: Entry['colorKey'];
  value: string;
};

const scoreBands: ScoreBand[] = [
  { min: 0, max: 2, colorKey: 'mutedRed', value: palette.mutedRed },
  { min: 3, max: 4, colorKey: 'brick', value: palette.brick },
  { min: 5, max: 6, colorKey: 'olive', value: palette.olive },
  { min: 7, max: 8, colorKey: 'moss', value: palette.moss },
  { min: 9, max: 10, colorKey: 'deepTeal', value: palette.deepTeal }
];

export const getColorKeyForScore = (score?: number | null): Entry['colorKey'] => {
  if (score == null) {
    return undefined;
  }
  const band = scoreBands.find((range) => score >= range.min && score <= range.max);
  return band?.colorKey;
};

export const getColorForKey = (key?: Entry['colorKey']) => {
  switch (key) {
    case 'mutedRed':
      return palette.mutedRed;
    case 'brick':
      return palette.brick;
    case 'olive':
      return palette.olive;
    case 'moss':
      return palette.moss;
    case 'deepTeal':
      return palette.deepTeal;
    default:
      return 'transparent';
  }
};
