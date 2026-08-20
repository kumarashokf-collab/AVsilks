export const MAX_TTS_TEXT_LENGTH =
  2000;

const LANGUAGE_PATTERN =
  /^[a-z]{2,3}-[A-Z]{2}$/;

export function resolveSpeechSynthesis(
  runtime = globalThis
) {
  const synthesis =
    runtime?.speechSynthesis;

  if (
    !synthesis ||
    typeof synthesis.speak !==
      "function" ||
    typeof synthesis.cancel !==
      "function"
  ) {
    return null;
  }

  return synthesis;
}

export function resolveSpeechUtterance(
  runtime = globalThis
) {
  const Utterance =
    runtime?.SpeechSynthesisUtterance;

  return typeof Utterance ===
    "function"
    ? Utterance
    : null;
}

function normalizeSpeechText(
  text
) {
  const normalized =
    String(text ?? "")
      .replace(/\s+/gu, " ")
      .trim();

  if (!normalized) {
    throw new TypeError(
      "Text-to-speech requires non-empty text"
    );
  }

  if (
    Array.from(normalized).length >
    MAX_TTS_TEXT_LENGTH
  ) {
    throw new RangeError(
      "Text-to-speech text is too long"
    );
  }

  return normalized;
}

function normalizeLanguage(
  language
) {
  const normalized =
    String(language ?? "").trim();

  if (
    !LANGUAGE_PATTERN.test(
      normalized
    )
  ) {
    throw new TypeError(
      "Text-to-speech language must be a valid locale"
    );
  }

  return normalized;
}

export function createSpeechUtterance({
  runtime = globalThis,
  text,
  language,
} = {}) {
  const safeText =
    normalizeSpeechText(text);

  const safeLanguage =
    normalizeLanguage(language);

  const Utterance =
    resolveSpeechUtterance(
      runtime
    );

  if (!Utterance) {
    return null;
  }

  const utterance =
    new Utterance(safeText);

  utterance.lang =
    safeLanguage;

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  return utterance;
}

function normalizeVoiceLanguage(
  language
) {
  return String(
    language ?? ""
  )
    .trim()
    .replace(/_/g, "-")
    .toLowerCase();
}

export function selectSpeechVoice(
  voices,
  language
) {
  const safeVoices =
    Array.isArray(voices)
      ? voices
      : [];

  const requested =
    normalizeVoiceLanguage(
      language
    );

  if (!requested) {
    return null;
  }

  const exact =
    safeVoices.find(
      (voice) =>
        normalizeVoiceLanguage(
          voice?.lang
        ) === requested
    );

  if (exact) {
    return exact;
  }

  const base =
    requested.split("-")[0];

  return (
    safeVoices.find(
      (voice) =>
        normalizeVoiceLanguage(
          voice?.lang
        ).split("-")[0] ===
        base
    ) || null
  );
}

export function speakText({
  runtime = globalThis,
  text,
  language,
  onStart,
  onEnd,
  onError,
} = {}) {
  const synthesis =
    resolveSpeechSynthesis(
      runtime
    );

  if (!synthesis) {
    return null;
  }

  const utterance =
    createSpeechUtterance({
      runtime,
      text,
      language,
    });

  if (!utterance) {
    return null;
  }

  const voices =
    typeof synthesis.getVoices ===
    "function"
      ? synthesis.getVoices()
      : [];

  const voice =
    selectSpeechVoice(
      voices,
      language
    );

  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => {
    if (
      typeof onStart ===
      "function"
    ) {
      onStart();
    }
  };

  utterance.onend = () => {
    if (
      typeof onEnd ===
      "function"
    ) {
      onEnd();
    }
  };

  utterance.onerror = () => {
    if (
      typeof onError ===
      "function"
    ) {
      onError();
    }
  };

  synthesis.cancel();
  synthesis.speak(utterance);

  return Object.freeze({
    synthesis,
    utterance,
  });
}

export function cancelSpeech(
  runtime = globalThis
) {
  const synthesis =
    resolveSpeechSynthesis(
      runtime
    );

  if (!synthesis) {
    return false;
  }

  synthesis.cancel();

  return true;
}
