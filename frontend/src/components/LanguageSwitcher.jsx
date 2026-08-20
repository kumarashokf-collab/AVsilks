import { useId } from "react";

import { useLocale } from "../context/LocaleContext";
import "./LanguageSwitcher.css";

function LanguageSwitcher() {
  const selectId = useId();

  const {
    locale,
    setLocale,
    supportedLocales,
    t,
  } = useLocale();

  return (
    <div className="language-switcher">
      <label
        htmlFor={selectId}
        className="language-switcher__label"
      >
        {t("language.label")}
      </label>

      <select
        id={selectId}
        className="language-switcher__select"
        value={locale}
        onChange={(event) =>
          setLocale(event.target.value)
        }
        aria-label={t("language.label")}
      >
        {supportedLocales.map(
          (item) => (
            <option
              key={item.code}
              value={item.code}
            >
              {item.nativeLabel}
            </option>
          )
        )}
      </select>
    </div>
  );
}

export default LanguageSwitcher;
