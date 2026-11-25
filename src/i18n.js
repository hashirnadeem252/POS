import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ur from "./locales/ur.json";

const updateDocumentDirection = (language) => {
  const isUrdu = language?.startsWith("ur");
  document.documentElement.lang = isUrdu ? "ur" : "en";
  document.documentElement.dir = isUrdu ? "rtl" : "ltr";
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ur"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", updateDocumentDirection);
updateDocumentDirection(i18n.resolvedLanguage || i18n.language);

export default i18n;
