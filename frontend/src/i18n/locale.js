export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = Object.freeze([
  Object.freeze({
    code: "en",
    intlLocale: "en-IN",
    nativeLabel: "English",
    dir: "ltr",
  }),
  Object.freeze({
    code: "te",
    intlLocale: "te-IN",
    nativeLabel: "తెలుగు",
    dir: "ltr",
  }),
  Object.freeze({
    code: "hi",
    intlLocale: "hi-IN",
    nativeLabel: "हिन्दी",
    dir: "ltr",
  }),
  Object.freeze({
    code: "ta",
    intlLocale: "ta-IN",
    nativeLabel: "தமிழ்",
    dir: "ltr",
  }),
  Object.freeze({
    code: "kn",
    intlLocale: "kn-IN",
    nativeLabel: "ಕನ್ನಡ",
    dir: "ltr",
  }),
]);

const LOCALE_BY_CODE = new Map(
  SUPPORTED_LOCALES.map((locale) => [
    locale.code,
    locale,
  ])
);

const TRANSLATIONS = Object.freeze({
  en: Object.freeze({
    "language.label": "Language",
    "nav.home": "Home",
    "nav.collection": "Collection",
    "nav.privacy": "Privacy",
    "nav.myCart": "My Cart",
    "nav.myProfile": "My Profile",
    "nav.myOrders": "My Orders",
    "nav.settings": "Settings",
    "nav.loginRegister": "Login / Register",
    "nav.privacyPolicy": "Privacy Policy",
    "nav.adminPanel": "Admin Panel",
    "actions.profile": "Profile",
    "actions.login": "Login",
    "actions.logout": "Logout",
    "actions.loginToBrand": "Login to {brand}",
    "account.welcome": "Welcome to {brand}",
    "account.shoppingAccount": "Your shopping account",
    "account.loginPrompt":
      "Login to checkout and view orders",
    "aria.openMenu": "Open navigation menu",
    "aria.closeMenu": "Close navigation menu",
    "aria.mainNavigation": "Main navigation",
    "aria.profile": "Open profile",
    "aria.login": "Login",
    "aria.cartItems": "Cart with {count} items",
    "aria.drawer": "Navigation drawer",
    "aria.brandHome": "{brand} home",
    "errors.logout":
      "We could not log you out. Please try again.",
  }),

  te: Object.freeze({
    "language.label": "భాష",
    "nav.home": "హోమ్",
    "nav.collection": "కలెక్షన్",
    "nav.privacy": "గోప్యత",
    "nav.myCart": "నా కార్ట్",
    "nav.myProfile": "నా ప్రొఫైల్",
    "nav.myOrders": "నా ఆర్డర్లు",
    "nav.settings": "సెట్టింగ్స్",
    "nav.loginRegister": "లాగిన్ / రిజిస్టర్",
    "nav.privacyPolicy": "గోప్యతా విధానం",
    "nav.adminPanel": "అడ్మిన్ ప్యానెల్",
    "actions.profile": "ప్రొఫైల్",
    "actions.login": "లాగిన్",
    "actions.logout": "లాగ్ అవుట్",
    "actions.loginToBrand": "{brand}లో లాగిన్ చేయండి",
    "account.welcome": "{brand}కు స్వాగతం",
    "account.shoppingAccount": "మీ షాపింగ్ ఖాతా",
    "account.loginPrompt":
      "చెకౌట్ చేసి ఆర్డర్లు చూడటానికి లాగిన్ చేయండి",
    "aria.openMenu": "నావిగేషన్ మెనూ తెరవండి",
    "aria.closeMenu": "నావిగేషన్ మెనూ మూసివేయండి",
    "aria.mainNavigation": "ప్రధాన నావిగేషన్",
    "aria.profile": "ప్రొఫైల్ తెరవండి",
    "aria.login": "లాగిన్",
    "aria.cartItems": "కార్ట్‌లో {count} వస్తువులు",
    "aria.drawer": "నావిగేషన్ డ్రాయర్",
    "aria.brandHome": "{brand} హోమ్",
    "errors.logout":
      "లాగ్ అవుట్ చేయలేకపోయాం. మళ్లీ ప్రయత్నించండి.",
  }),

  hi: Object.freeze({
    "language.label": "भाषा",
    "nav.home": "होम",
    "nav.collection": "संग्रह",
    "nav.privacy": "गोपनीयता",
    "nav.myCart": "मेरी कार्ट",
    "nav.myProfile": "मेरी प्रोफ़ाइल",
    "nav.myOrders": "मेरे ऑर्डर",
    "nav.settings": "सेटिंग्स",
    "nav.loginRegister": "लॉगिन / रजिस्टर",
    "nav.privacyPolicy": "गोपनीयता नीति",
    "nav.adminPanel": "एडमिन पैनल",
    "actions.profile": "प्रोफ़ाइल",
    "actions.login": "लॉगिन",
    "actions.logout": "लॉग आउट",
    "actions.loginToBrand": "{brand} में लॉगिन करें",
    "account.welcome": "{brand} में आपका स्वागत है",
    "account.shoppingAccount": "आपका शॉपिंग खाता",
    "account.loginPrompt":
      "चेकआउट और ऑर्डर देखने के लिए लॉगिन करें",
    "aria.openMenu": "नेविगेशन मेनू खोलें",
    "aria.closeMenu": "नेविगेशन मेनू बंद करें",
    "aria.mainNavigation": "मुख्य नेविगेशन",
    "aria.profile": "प्रोफ़ाइल खोलें",
    "aria.login": "लॉगिन",
    "aria.cartItems": "कार्ट में {count} आइटम",
    "aria.drawer": "नेविगेशन ड्रॉअर",
    "aria.brandHome": "{brand} होम",
    "errors.logout":
      "लॉग आउट नहीं हो सका। कृपया फिर से प्रयास करें।",
  }),

  ta: Object.freeze({
    "language.label": "மொழி",
    "nav.home": "முகப்பு",
    "nav.collection": "தொகுப்பு",
    "nav.privacy": "தனியுரிமை",
    "nav.myCart": "என் வண்டி",
    "nav.myProfile": "என் சுயவிவரம்",
    "nav.myOrders": "என் ஆர்டர்கள்",
    "nav.settings": "அமைப்புகள்",
    "nav.loginRegister": "உள்நுழைவு / பதிவு",
    "nav.privacyPolicy": "தனியுரிமைக் கொள்கை",
    "nav.adminPanel": "நிர்வாகப் பலகம்",
    "actions.profile": "சுயவிவரம்",
    "actions.login": "உள்நுழைவு",
    "actions.logout": "வெளியேறு",
    "actions.loginToBrand":
      "{brand}-இல் உள்நுழையவும்",
    "account.welcome": "{brand}-க்கு வரவேற்கிறோம்",
    "account.shoppingAccount": "உங்கள் வாங்கும் கணக்கு",
    "account.loginPrompt":
      "செக்அவுட் செய்து ஆர்டர்களைப் பார்க்க உள்நுழையவும்",
    "aria.openMenu": "வழிசெலுத்தல் மெனுவைத் திறக்கவும்",
    "aria.closeMenu": "வழிசெலுத்தல் மெனுவை மூடவும்",
    "aria.mainNavigation": "முதன்மை வழிசெலுத்தல்",
    "aria.profile": "சுயவிவரத்தைத் திறக்கவும்",
    "aria.login": "உள்நுழைவு",
    "aria.cartItems": "வண்டியில் {count} பொருட்கள்",
    "aria.drawer": "வழிசெலுத்தல் பலகம்",
    "aria.brandHome": "{brand} முகப்பு",
    "errors.logout":
      "வெளியேற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  }),

  kn: Object.freeze({
    "language.label": "ಭಾಷೆ",
    "nav.home": "ಮುಖಪುಟ",
    "nav.collection": "ಸಂಗ್ರಹ",
    "nav.privacy": "ಗೌಪ್ಯತೆ",
    "nav.myCart": "ನನ್ನ ಕಾರ್ಟ್",
    "nav.myProfile": "ನನ್ನ ಪ್ರೊಫೈಲ್",
    "nav.myOrders": "ನನ್ನ ಆರ್ಡರ್‌ಗಳು",
    "nav.settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "nav.loginRegister": "ಲಾಗಿನ್ / ನೋಂದಣಿ",
    "nav.privacyPolicy": "ಗೌಪ್ಯತಾ ನೀತಿ",
    "nav.adminPanel": "ಅಡ್ಮಿನ್ ಪ್ಯಾನೆಲ್",
    "actions.profile": "ಪ್ರೊಫೈಲ್",
    "actions.login": "ಲಾಗಿನ್",
    "actions.logout": "ಲಾಗ್ ಔಟ್",
    "actions.loginToBrand":
      "{brand}ಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
    "account.welcome":
      "{brand}ಗೆ ಸ್ವಾಗತ",
    "account.shoppingAccount":
      "ನಿಮ್ಮ ಶಾಪಿಂಗ್ ಖಾತೆ",
    "account.loginPrompt":
      "ಚೆಕ್‌ಔಟ್ ಮಾಡಲು ಮತ್ತು ಆರ್ಡರ್‌ಗಳನ್ನು ನೋಡಲು ಲಾಗಿನ್ ಮಾಡಿ",
    "aria.openMenu":
      "ನ್ಯಾವಿಗೇಶನ್ ಮೆನು ತೆರೆಯಿರಿ",
    "aria.closeMenu":
      "ನ್ಯಾವಿಗೇಶನ್ ಮೆನು ಮುಚ್ಚಿರಿ",
    "aria.mainNavigation":
      "ಮುಖ್ಯ ನ್ಯಾವಿಗೇಶನ್",
    "aria.profile":
      "ಪ್ರೊಫೈಲ್ ತೆರೆಯಿರಿ",
    "aria.login": "ಲಾಗಿನ್",
    "aria.cartItems":
      "ಕಾರ್ಟ್‌ನಲ್ಲಿ {count} ವಸ್ತುಗಳು",
    "aria.drawer":
      "ನ್ಯಾವಿಗೇಶನ್ ಡ್ರಾಯರ್",
    "aria.brandHome":
      "{brand} ಮುಖಪುಟ",
    "errors.logout":
      "ಲಾಗ್ ಔಟ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  }),
});

export function normalizeLocale(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (!normalized) {
    return DEFAULT_LOCALE;
  }

  const exact = SUPPORTED_LOCALES.find(
    (locale) =>
      locale.code === normalized ||
      locale.intlLocale.toLowerCase() === normalized
  );

  if (exact) {
    return exact.code;
  }

  const language = normalized.split("-")[0];

  return LOCALE_BY_CODE.has(language)
    ? language
    : DEFAULT_LOCALE;
}

export function getLocaleMeta(locale) {
  return LOCALE_BY_CODE.get(
    normalizeLocale(locale)
  );
}

export function translate(
  locale,
  key,
  parameters = {}
) {
  const code = normalizeLocale(locale);

  const template =
    TRANSLATIONS[code]?.[key] ??
    TRANSLATIONS[DEFAULT_LOCALE]?.[key] ??
    key;

  return String(template).replace(
    /\{([A-Za-z0-9_]+)\}/g,
    (match, name) =>
      Object.prototype.hasOwnProperty.call(
        parameters,
        name
      )
        ? String(parameters[name])
        : match
  );
}

export function formatCurrency(
  value,
  locale = DEFAULT_LOCALE,
  currency = "INR"
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    throw new TypeError(
      "Currency value must be finite"
    );
  }

  const meta = getLocaleMeta(locale);

  return new Intl.NumberFormat(
    meta.intlLocale,
    {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

export function formatDate(
  value,
  locale = DEFAULT_LOCALE,
  options = {
    dateStyle: "medium",
  }
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      "Date value must be valid"
    );
  }

  const meta = getLocaleMeta(locale);

  return new Intl.DateTimeFormat(
    meta.intlLocale,
    options
  ).format(date);
}

export function normalizeSearchText(
  value,
  locale = DEFAULT_LOCALE
) {
  const meta = getLocaleMeta(locale);

  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase(meta.intlLocale)
    .trim()
    .replace(/\s+/gu, " ");
}
