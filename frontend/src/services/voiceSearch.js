export function resolveSpeechRecognition(
  runtime = globalThis
) {
  const candidate =
    runtime?.SpeechRecognition ||
    runtime?.webkitSpeechRecognition;

  return typeof candidate === "function"
    ? candidate
    : null;
}

export function createSpeechRecognition({
  runtime = globalThis,
  language,
} = {}) {
  const normalizedLanguage =
    String(language || "").trim();

  if (
    !/^[a-z]{2,3}-[A-Z]{2}$/.test(
      normalizedLanguage
    )
  ) {
    throw new TypeError(
      "Voice search language must be a valid locale"
    );
  }

  const SpeechRecognition =
    resolveSpeechRecognition(runtime);

  if (!SpeechRecognition) {
    return null;
  }

  const recognition =
    new SpeechRecognition();

  recognition.lang =
    normalizedLanguage;

  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  return recognition;
}
