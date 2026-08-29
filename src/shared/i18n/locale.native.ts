import * as Localization from 'expo-localization';

export function getInitialLanguage(): string {
  return Localization.getLocales()[0]?.languageCode?.split('-')[0] ?? 'es';
}
