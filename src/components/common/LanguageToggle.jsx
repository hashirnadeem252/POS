import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";

function LanguageToggle({ className = "" }) {
  const { t, i18n } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language).startsWith("ur")
    ? "ur"
    : "en";

  return (
    <label className={`language-control ${className}`}>
      <Globe2 size={16} aria-hidden="true" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        className="language-toggle"
        value={language}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        aria-label={t("language.label")}
        dir="ltr"
      >
        <option value="en">English</option>
        <option value="ur">اردو</option>
      </select>
    </label>
  );
}

export default LanguageToggle;
