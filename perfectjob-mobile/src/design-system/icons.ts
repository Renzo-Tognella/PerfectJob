export interface IconSpec {
  family: 'MaterialIcons' | 'Ionicons' | 'Feather';
  name: string;
}

export const ICONS = {
  person: { family: 'MaterialIcons' as const, name: 'person' },
  email: { family: 'MaterialIcons' as const, name: 'email' },
  lock: { family: 'MaterialIcons' as const, name: 'lock' },
  search: { family: 'Feather' as const, name: 'search' },
  bell: { family: 'MaterialIcons' as const, name: 'notifications-none' },
  computer: { family: 'MaterialIcons' as const, name: 'computer' },
  barChart: { family: 'Ionicons' as const, name: 'bar-chart' },
  palette: { family: 'MaterialIcons' as const, name: 'palette' },
  campaign: { family: 'MaterialIcons' as const, name: 'campaign' },
  handshake: { family: 'MaterialIcons' as const, name: 'handshake' },
  groups: { family: 'MaterialIcons' as const, name: 'groups' },
  document: { family: 'Ionicons' as const, name: 'document-text' },
  settings: { family: 'Feather' as const, name: 'settings' },
  heart: { family: 'MaterialIcons' as const, name: 'favorite-border' },
  heartFilled: { family: 'MaterialIcons' as const, name: 'favorite' },
  fileText: { family: 'Feather' as const, name: 'file-text' },
  close: { family: 'MaterialIcons' as const, name: 'close' },
} as const satisfies Record<string, IconSpec>;
