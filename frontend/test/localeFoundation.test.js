import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  formatCurrency,
  formatDate,
  normalizeLocale,
  normalizeSearchText,
  translate,
} from "../src/i18n/locale.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const frontendRoot =
  path.resolve(__dirname, "..");

test(
  "defines the initial India multilingual locale contract",
  () => {
    assert.equal(
      DEFAULT_LOCALE,
      "en"
    );

    assert.deepEqual(
      SUPPORTED_LOCALES.map(
        (locale) => locale.code
      ),
      ["en", "te", "hi", "ta", "kn"]
    );

    assert.equal(
      normalizeLocale("te-IN"),
      "te"
    );

    assert.equal(
      normalizeLocale("HI_in"),
      "hi"
    );

    assert.equal(
      normalizeLocale("kn-IN"),
      "kn"
    );

    assert.equal(
      normalizeLocale("bn-IN"),
      "en"
    );
  }
);

test(
  "translates common UI in all five languages with English fallback",
  () => {
    assert.equal(
      translate("te", "nav.home"),
      "హోమ్"
    );

    assert.equal(
      translate("hi", "nav.home"),
      "होम"
    );

    assert.equal(
      translate("ta", "nav.home"),
      "முகப்பு"
    );

    assert.equal(
      translate("kn", "nav.home"),
      "ಮುಖಪುಟ"
    );

    assert.equal(
      translate("bn", "nav.home"),
      "Home"
    );

    assert.equal(
      translate(
        "te",
        "account.welcome",
        { brand: "AV Silks" }
      ),
      "AV Silksకు స్వాగతం"
    );
  }
);

test(
  "provides locale-aware India currency and date formatting",
  () => {
    for (
      const locale
      of ["en", "te", "hi", "ta", "kn"]
    ) {
      const currency =
        formatCurrency(
          1234.5,
          locale
        );

      const date =
        formatDate(
          "2026-08-21T00:00:00Z",
          locale
        );

      assert.equal(
        typeof currency,
        "string"
      );

      assert.ok(
        currency.length > 0
      );

      assert.equal(
        typeof date,
        "string"
      );

      assert.ok(
        date.length > 0
      );
    }
  }
);

test(
  "normalizes Unicode search text without stripping Indian scripts",
  () => {
    assert.equal(
      normalizeSearchText(
        "  పట్టు   చీర  ",
        "te"
      ),
      "పట్టు చీర"
    );

    assert.equal(
      normalizeSearchText(
        "  ರೇಷ್ಮೆ   ಸೀರೆ  ",
        "kn"
      ),
      "ರೇಷ್ಮೆ ಸೀರೆ"
    );

    assert.equal(
      normalizeSearchText(
        "  SILK   SAREE ",
        "en"
      ),
      "silk saree"
    );
  }
);

test(
  "wires persistent locale provider and navigation language switcher",
  () => {
    const main =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "main.jsx"
        ),
        "utf8"
      );

    const context =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "context",
          "LocaleContext.jsx"
        ),
        "utf8"
      );

    const navbar =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "components",
          "Navbar.jsx"
        ),
        "utf8"
      );

    assert.match(
      main,
      /<LocaleProvider>[\s\S]*<App\s*\/>[\s\S]*<\/LocaleProvider>/
    );

    assert.match(
      context,
      /avsilks\.locale\.v1/
    );

    assert.match(
      context,
      /html\.lang\s*=\s*meta\.intlLocale/
    );

    assert.match(
      context,
      /html\.dir\s*=\s*meta\.dir/
    );

    assert.match(
      navbar,
      /<LanguageSwitcher\s*\/>/
    );

    assert.match(
      navbar,
      /useLocale/
    );
  }
);

console.log(
  "LOCALE_FOUNDATION_TEST_SETUP=PASS"
);
