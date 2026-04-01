import { createI18n } from 'vue-i18n';
import en from '../locales/en.json' with { type: 'json' };
import it from '../locales/it.json' with { type: 'json' };

const i18n = createI18n({
  legacy: false, // Use Composition API
  globalInjection: true, // Allow $t in templates
  locale: 'en', // Set default locale
  fallbackLocale: 'en', // Set fallback locale
  messages: {
    en,
    it
  }
});

export default i18n;
