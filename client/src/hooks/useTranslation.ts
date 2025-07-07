import { translations, type Language, type TranslationKey } from "@/lib/translations";
import { useAuth } from "./useAuth";

export function useTranslation() {
  const { user } = useAuth();
  const currentLanguage = (user?.language as Language) || "en";

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = translations[currentLanguage][key] || translations.en[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    
    return text;
  };

  return { t, currentLanguage };
}