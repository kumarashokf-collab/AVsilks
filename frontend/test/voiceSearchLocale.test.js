import test from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync
} from "node:fs";
import path from "node:path";
import {
  fileURLToPath
} from "node:url";

import {
  SUPPORTED_LOCALES,
  translate,
} from "../src/i18n/locale.js";

import {
  createSpeechRecognition,
  resolveSpeechRecognition,
} from "../src/services/voiceSearch.js";

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(__filename);

const frontendRoot =
  path.resolve(
    __dirname,
    ".."
  );

test(
  "maps all supported locales to India speech locales",
  () => {
    assert.deepEqual(
      SUPPORTED_LOCALES.map(
        ({
          code,
          intlLocale
        }) => [
          code,
          intlLocale
        ]
      ),
      [
        ["en", "en-IN"],
        ["te", "te-IN"],
        ["hi", "hi-IN"],
        ["ta", "ta-IN"],
        ["kn", "kn-IN"],
      ]
    );
  }
);

test(
  "resolves standard and webkit speech recognition safely",
  () => {
    class StandardRecognition {}
    class WebkitRecognition {}

    assert.equal(
      resolveSpeechRecognition({
        SpeechRecognition:
          StandardRecognition,
        webkitSpeechRecognition:
          WebkitRecognition,
      }),
      StandardRecognition
    );

    assert.equal(
      resolveSpeechRecognition({
        webkitSpeechRecognition:
          WebkitRecognition,
      }),
      WebkitRecognition
    );

    assert.equal(
      resolveSpeechRecognition(
        {}
      ),
      null
    );
  }
);

test(
  "creates locale-aware recognition with safe fixed options",
  () => {
    class FakeRecognition {}

    const recognition =
      createSpeechRecognition({
        runtime: {
          SpeechRecognition:
            FakeRecognition,
        },
        language: "kn-IN",
      });

    assert.ok(
      recognition instanceof
        FakeRecognition
    );

    assert.equal(
      recognition.lang,
      "kn-IN"
    );

    assert.equal(
      recognition.interimResults,
      false
    );

    assert.equal(
      recognition.maxAlternatives,
      1
    );

    assert.equal(
      recognition.continuous,
      false
    );

    assert.throws(
      () =>
        createSpeechRecognition({
          runtime: {
            SpeechRecognition:
              FakeRecognition,
          },
          language:
            "invalid",
        }),
      /valid locale/
    );
  }
);

test(
  "provides translated voice UI for all five languages",
  () => {
    for (
      const locale of [
        "en",
        "te",
        "hi",
        "ta",
        "kn"
      ]
    ) {
      for (
        const key of [
          "search.placeholder",
          "search.voiceListening",
          "search.voiceError"
        ]
      ) {
        assert.notEqual(
          translate(
            locale,
            key
          ),
          key
        );
      }
    }

    assert.equal(
      translate(
        "kn",
        "search.placeholder"
      ),
      "ಸೀರೆಗಳನ್ನು ಹುಡುಕಿ..."
    );
  }
);

test(
  "SearchAI binds speech recognition to selected locale",
  () => {
    const source =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "components",
          "SearchAI.jsx"
        ),
        "utf8"
      );

    assert.match(
      source,
      /useLocale/
    );

    assert.match(
      source,
      /createSpeechRecognition/
    );

    assert.match(
      source,
      /language:\s*localeMeta\.intlLocale/
    );

    assert.match(
      source,
      /matchesSearchText/
    );

    assert.match(
      source,
      /localeMeta\.code/
    );

    assert.match(
      source,
      /search\.voiceListening/
    );

    assert.doesNotMatch(
      source,
      /recognition\.lang\s*=\s*["']te-IN["']/
    );
  }
);

console.log(
  "LOCALE_VOICE_SEARCH_TEST_SETUP=PASS"
);
