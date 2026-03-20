export const C = {
  bg:       '#111111',
  surface:  '#1C1C1C',
  surface2: '#242424',
  surface3: '#2C2C2C',
  text:     '#F5F4F2',
  textMid:  '#8A8A8A',
  textDim:  '#4A4A4A',
  border:   '#2A2A2A',
  border2:  '#333333',
  amber:    '#E8A030',
  amberDim: '#C48828',
  paid:     '#3D9B6B',
  error:    '#D95535',
} as const;

export const STATUS_BG: Record<string, string> = {
  draft:      '#242424',
  quote_sent: '#1E2530',
  accepted:   '#1A2E24',
  invoiced:   '#2E2010',
  paid:       '#1A2E24',
};

export const STATUS_TEXT: Record<string, string> = {
  draft:      '#8A8A8A',
  quote_sent: '#6B9FD4',
  accepted:   '#5DBF8C',
  invoiced:   '#E8A030',
  paid:       '#3D9B6B',
};

export const STATUS_LABEL: Record<string, string> = {
  draft:      'Entwurf',
  quote_sent: 'Angebot',
  accepted:   'Angenommen',
  invoiced:   'Rechnung',
  paid:       'Bezahlt',
};
