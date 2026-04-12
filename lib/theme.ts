import { useColorScheme } from 'react-native';
import { JobStatus } from '../types';

// ---------------------------------------------------------------------------
// Font family constants — Geist for display/data, Inter for body/labels
// ---------------------------------------------------------------------------
export const F = {
  // Geist — display, headline, data
  displayBold:    'Geist_700Bold',
  headlineSemi:   'Geist_600SemiBold',
  dataBold:       'Geist_700Bold',

  // Inter — body, labels, UI
  body:           'Inter_400Regular',
  bodySemi:       'Inter_600SemiBold',
  bodyMedium:     'Inter_500Medium',
  labelSemi:      'Inter_600SemiBold',
} as const;

// ---------------------------------------------------------------------------
// Color tokens — light & dark variants of the Analytical Monolith
// ---------------------------------------------------------------------------
const lightTokens = {
  primary:            '#000000',
  on_primary:         '#FFFFFF',
  surface:            '#F9F9F9',
  surface_low:        '#F3F3F3',
  surface_container:  '#EEEEEE',
  surface_high:       '#E8E8E8',
  surface_highest:    '#E2E2E2',
  surface_card:       '#FFFFFF',
  on_surface:         '#1A1C1C',
  on_surface_variant: '#5E5E5E',
  outline:            '#747878',
  outline_variant:    '#C4C7C7',
  primary_container:  '#1C1B1B',
  success:            '#2D7A4F',
  warning:            '#8A6D00',
  error:              '#BA1A1A',

  // Status badge backgrounds (semantic color at 12% opacity)
  status_draft_bg:      '#E8E8E8',
  status_draft_text:    '#747878',
  status_quote_bg:      'rgba(26, 28, 28, 0.08)',
  status_quote_text:    '#1A1C1C',
  status_in_progress_bg:   'rgba(186, 26, 26, 0.12)',
  status_in_progress_text: '#BA1A1A',
  status_invoiced_bg:   'rgba(138, 109, 0, 0.12)',
  status_invoiced_text: '#8A6D00',
  status_paid_bg:       'rgba(45, 122, 79, 0.12)',
  status_paid_text:     '#2D7A4F',

  // Progress dots
  dot_done:    '#2D7A4F',
  dot_current: '#000000',
  dot_future:  '#C4C7C7',

  // Glassmorphism
  glass_bg:    'rgba(255,255,255,0.8)',
  glass_blur:  16,

  // Ambient shadow (for floating elements)
  shadow_color:   '#000000',
  shadow_opacity: 0.04,
} as const;

const darkTokens = {
  primary:            '#FFFFFF',
  on_primary:         '#000000',
  surface:            '#0F0F0F',
  surface_low:        '#141414',
  surface_container:  '#1A1A1A',
  surface_high:       '#212121',
  surface_highest:    '#282828',
  surface_card:       '#141414',
  on_surface:         '#E6E6E6',
  on_surface_variant: '#8A8A8A',
  outline:            '#5A5A5A',
  outline_variant:    '#3A3A3A',
  primary_container:  '#1C1B1B',
  success:            '#4ADE80',
  warning:            '#FBBF24',
  error:              '#FF6B6B',

  // Status badge backgrounds
  status_draft_bg:      '#282828',
  status_draft_text:    '#8A8A8A',
  status_quote_bg:      'rgba(255, 255, 255, 0.08)',
  status_quote_text:    '#E6E6E6',
  status_in_progress_bg:   'rgba(255, 107, 107, 0.12)',
  status_in_progress_text: '#FF6B6B',
  status_invoiced_bg:   'rgba(251, 191, 36, 0.12)',
  status_invoiced_text: '#FBBF24',
  status_paid_bg:       'rgba(74, 222, 128, 0.12)',
  status_paid_text:     '#4ADE80',

  // Progress dots
  dot_done:    '#4ADE80',
  dot_current: '#FFFFFF',
  dot_future:  '#3A3A3A',

  // Glassmorphism
  glass_bg:    'rgba(20,20,20,0.8)',
  glass_blur:  16,

  // Ambient shadow
  shadow_color:   '#FFFFFF',
  shadow_opacity: 0.03,
} as const;

export type ThemeTokens = {
  [K in keyof typeof lightTokens]: (typeof lightTokens)[K] extends number ? number : string;
};

// ---------------------------------------------------------------------------
// Theme hook
// ---------------------------------------------------------------------------
export function useTheme(): ThemeTokens {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTokens : lightTokens;
}

// ---------------------------------------------------------------------------
// Status helpers (not color-dependent — kept as simple maps)
// ---------------------------------------------------------------------------
export const ACTIVE_STATUSES = new Set<JobStatus>(['in_progress', 'invoiced']);

export const STATUS_LABEL: Record<string, string> = {
  draft:      'Entwurf',
  quote_sent: 'Angebot',
  in_progress: 'In Arbeit',
  invoiced:   'Rechnung',
  paid:       'Bezahlt',
};

// Status colors are accessed via theme tokens:
//   t.status_draft_bg, t.status_draft_text, etc.
// Helper to get the right token keys for a given status:
export function statusColors(t: ThemeTokens, status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    draft:      { bg: t.status_draft_bg,      text: t.status_draft_text },
    quote_sent: { bg: t.status_quote_bg,      text: t.status_quote_text },
    in_progress: { bg: t.status_in_progress_bg, text: t.status_in_progress_text },
    invoiced:   { bg: t.status_invoiced_bg,    text: t.status_invoiced_text },
    paid:       { bg: t.status_paid_bg,        text: t.status_paid_text },
  };
  return map[status] ?? { bg: t.surface_high, text: t.outline };
}
