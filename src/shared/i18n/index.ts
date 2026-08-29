import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { es } from './locales/es';
import { getInitialLanguage } from './locale';

const resources = {
  es: { translation: es },
} as const;

const deviceLanguage = getInitialLanguage();
const initialLanguage = Object.prototype.hasOwnProperty.call(resources, deviceLanguage)
  ? deviceLanguage
  : 'es';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'es',
    // Resources are bundled locally. Initialize synchronously so screens do
    // not render translation keys during the first frame.
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export { resources };
export default i18n;
