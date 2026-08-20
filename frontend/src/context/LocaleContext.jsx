import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  formatCurrency as formatCurrencyValue,
  formatDate as formatDateValue,
  getLocaleMeta,
  normalizeLocale,
  normalizeSearchText as normalizeSearchTextValue,
  translate,
} from "../i18n/locale";

const STORAGE_KEY = "avsilks.locale.v1";

const LocaleContext = createContext(null);

function readInitialLocale() {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (stored) {
      return normalizeLocale(stored);
    }
  } catch {
    // Storage may be unavailable.
  }

  const browserLocale =
    globalThis.navigator?.languages?.[0] ||
    globalThis.navigator?.language ||
    DEFAULT_LOCALE;

  return normalizeLocale(browserLocale);
}

export function LocaleProvider({
  children,
}) {
  const [locale, setLocaleState] =
    useState(readInitialLocale);

  const setLocale = useCallback(
    (nextLocale) => {
      setLocaleState(
        normalizeLocale(nextLocale)
      );
    },
    []
  );

  useEffect(() => {
    const meta = getLocaleMeta(locale);

    if (typeof document !== "undefined") {
      const html =
        document.documentElement;

      html.lang = meta.intlLocale;
      html.dir = meta.dir;
      html.dataset.locale = locale;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        locale
      );
    } catch {
      // Locale remains active in memory.
    }
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      localeMeta:
        getLocaleMeta(locale),
      supportedLocales:
        SUPPORTED_LOCALES,
      setLocale,
      t: (key, parameters) =>
        translate(
          locale,
          key,
          parameters
        ),
      formatCurrency: (
        amount,
        currency = "INR"
      ) =>
        formatCurrencyValue(
          amount,
          locale,
          currency
        ),
      formatDate: (
        date,
        options
      ) =>
        formatDateValue(
          date,
          locale,
          options
        ),
      normalizeSearchText: (value) =>
        normalizeSearchTextValue(
          value,
          locale
        ),
    }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider
      value={value}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const value =
    useContext(LocaleContext);

  if (!value) {
    throw new Error(
      "useLocale must be used inside LocaleProvider"
    );
  }

  return value;
}

export {
  STORAGE_KEY as LOCALE_STORAGE_KEY,
};
