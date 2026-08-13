import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const savedLanguage = localStorage.getItem('language') || 'uz';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: savedLanguage,
    fallbackLng: 'uz',
    debug: false,
    supportedLngs: ['uz', 'uz-Cyrl', 'ru'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
      excludeCacheFor: ['cimode']
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/translation.json?v=' + Date.now(),
      requestOptions: {
        cache: 'no-cache'
      }
    },

    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    },
    
    ns: ['translation'],
    defaultNS: 'translation',
    
    keySeparator: '.',
    
    load: 'currentOnly',
    
    saveMissing: false,
    
    missingKeyHandler: false,
    
    returnNull: false,
    returnEmptyString: false,
    returnObjects: false,
    
    joinArrays: false,
    
    parseMissingKeyHandler: false,
  });

export default i18n;