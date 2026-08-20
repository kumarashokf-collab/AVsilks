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
  cancelSpeech,
  createSpeechUtterance,
  resolveSpeechSynthesis,
  resolveSpeechUtterance,
  selectSpeechVoice,
  speakText,
} from "../src/services/textToSpeech.js";

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
  "resolves browser text-to-speech capabilities fail closed",
  () => {
    const synthesis = {
      speak() {},
      cancel() {},
    };

    class FakeUtterance {}

    assert.equal(
      resolveSpeechSynthesis({
        speechSynthesis:
          synthesis,
      }),
      synthesis
    );

    assert.equal(
      resolveSpeechSynthesis(
        {}
      ),
      null
    );

    assert.equal(
      resolveSpeechUtterance({
        SpeechSynthesisUtterance:
          FakeUtterance,
      }),
      FakeUtterance
    );

    assert.equal(
      resolveSpeechUtterance(
        {}
      ),
      null
    );
  }
);

test(
  "creates safe locale-aware speech utterances",
  () => {
    class FakeUtterance {
      constructor(text) {
        this.text = text;
      }
    }

    const utterance =
      createSpeechUtterance({
        runtime: {
          SpeechSynthesisUtterance:
            FakeUtterance,
        },
        text:
          "  ಕನ್ನಡ   ರೇಷ್ಮೆ ಸೀರೆ  ",
        language: "kn-IN",
      });

    assert.equal(
      utterance.text,
      "ಕನ್ನಡ ರೇಷ್ಮೆ ಸೀರೆ"
    );

    assert.equal(
      utterance.lang,
      "kn-IN"
    );

    assert.equal(
      utterance.rate,
      1
    );

    assert.equal(
      utterance.pitch,
      1
    );

    assert.equal(
      utterance.volume,
      1
    );

    assert.throws(
      () =>
        createSpeechUtterance({
          runtime: {
            SpeechSynthesisUtterance:
              FakeUtterance,
          },
          text: "hello",
          language: "invalid",
        }),
      /valid locale/
    );

    assert.throws(
      () =>
        createSpeechUtterance({
          runtime: {
            SpeechSynthesisUtterance:
              FakeUtterance,
          },
          text: "   ",
          language: "en-IN",
        }),
      /non-empty text/
    );
  }
);

test(
  "selects exact locale voice before language-family fallback",
  () => {
    const voices = [
      {
        name: "English",
        lang: "en-US",
      },
      {
        name: "Kannada",
        lang: "kn-IN",
      },
      {
        name: "Telugu",
        lang: "te-IN",
      },
    ];

    assert.equal(
      selectSpeechVoice(
        voices,
        "kn-IN"
      )?.name,
      "Kannada"
    );

    assert.equal(
      selectSpeechVoice(
        voices,
        "en-IN"
      )?.name,
      "English"
    );

    assert.equal(
      selectSpeechVoice(
        voices,
        "fr-FR"
      ),
      null
    );
  }
);

test(
  "speaks selected-locale text and supports explicit cancellation",
  () => {
    class FakeUtterance {
      constructor(text) {
        this.text = text;
      }
    }

    const calls = [];

    const voices = [
      {
        name: "Telugu",
        lang: "te-IN",
      },
    ];

    const synthesis = {
      getVoices() {
        return voices;
      },
      cancel() {
        calls.push(
          "cancel"
        );
      },
      speak(utterance) {
        calls.push(
          "speak"
        );

        utterance.onstart?.();
      },
    };

    const runtime = {
      speechSynthesis:
        synthesis,
      SpeechSynthesisUtterance:
        FakeUtterance,
    };

    let started = false;
    let ended = false;

    const session =
      speakText({
        runtime,
        text: "పట్టు చీర",
        language: "te-IN",
        onStart: () => {
          started = true;
        },
        onEnd: () => {
          ended = true;
        },
      });

    assert.ok(session);

    assert.deepEqual(
      calls,
      [
        "cancel",
        "speak",
      ]
    );

    assert.equal(
      started,
      true
    );

    assert.equal(
      session.utterance.lang,
      "te-IN"
    );

    assert.equal(
      session.utterance.voice,
      voices[0]
    );

    session.utterance
      .onend?.();

    assert.equal(
      ended,
      true
    );

    assert.equal(
      cancelSpeech(runtime),
      true
    );

    assert.deepEqual(
      calls,
      [
        "cancel",
        "speak",
        "cancel",
      ]
    );
  }
);

test(
  "wires five-language TTS into SearchAI without app-side network transport",
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
          "search.ttsAria",
          "search.ttsStopAria",
          "search.ttsUnsupported",
          "search.ttsError",
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

    const searchAI =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "components",
          "SearchAI.jsx"
        ),
        "utf8"
      );

    const service =
      readFileSync(
        path.join(
          frontendRoot,
          "src",
          "services",
          "textToSpeech.js"
        ),
        "utf8"
      );

    assert.match(
      searchAI,
      /speakText/
    );

    assert.match(
      searchAI,
      /cancelSpeech/
    );

    assert.match(
      searchAI,
      /localeMeta\.intlLocale/
    );

    assert.match(
      searchAI,
      /search\.ttsAria/
    );

    assert.match(
      searchAI,
      /FaVolumeUp/
    );

    assert.match(
      searchAI,
      /FaStop/
    );

    assert.doesNotMatch(
      service,
      /\bfetch\s*\(/
    );

    assert.doesNotMatch(
      service,
      /\baxios\b/
    );

    assert.doesNotMatch(
      service,
      /XMLHttpRequest/
    );
  }
);

console.log(
  "LOCALE_TEXT_TO_SPEECH_TEST_SETUP=PASS"
);
