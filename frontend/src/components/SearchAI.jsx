import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  FaMagic,
  FaMicrophone,
  FaStop,
  FaTimes,
  FaVolumeUp
} from "react-icons/fa";

import { BRAND } from "../config/branding";
import { useLocale } from "../context/LocaleContext";
import {
  createSpeechRecognition
} from "../services/voiceSearch";
import {
  matchesSearchText
} from "../services/searchMatching";
import {
  cancelSpeech,
  speakText
} from "../services/textToSpeech";

const DEFAULT_SUGGESTIONS = [
  "Kanchipuram",
  "Dharmavaram",
  "Silk",
  "Cotton"
];

function SearchAI({
  onSearchChange = () => {},
  suggestions = DEFAULT_SUGGESTIONS
}) {
  const {
    localeMeta,
    t
  } = useLocale();

  const recognitionRef = useRef(null);

  const [query, setQuery] =
    useState("");

  const [
    assistantOpen,
    setAssistantOpen
  ] = useState(false);

  const [listening, setListening] =
    useState(false);

  const [speaking, setSpeaking] =
    useState(false);

  const [message, setMessage] =
    useState(() =>
      t("search.prompt")
    );

  function disposeRecognition() {
    const recognition =
      recognitionRef.current;

    if (!recognition) {
      return;
    }

    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;

    try {
      recognition.abort();
    } catch {
      // Recognition may already be stopped.
    }

    recognitionRef.current = null;
  }

  useEffect(() => {
    disposeRecognition();
    cancelSpeech(window);
    setListening(false);
    setSpeaking(false);
    setMessage(
      t("search.prompt")
    );
  }, [
    localeMeta.intlLocale,
    t
  ]);

  useEffect(
    () => () => {
      disposeRecognition();
      cancelSpeech(window);
    },
    []
  );

  const visibleSuggestions =
    useMemo(() => {
      const normalizedQuery =
        String(query ?? "").trim();

      if (!normalizedQuery) {
        return suggestions.slice(
          0,
          4
        );
      }

      return suggestions
        .filter((item) =>
          matchesSearchText(
            String(item ?? ""),
            normalizedQuery,
            localeMeta.code
          )
        )
        .slice(0, 4);
    }, [
      localeMeta.code,
      query,
      suggestions
    ]);

  function updateSearch(value) {
    const safeValue =
      String(value ?? "");

    setQuery(safeValue);
    onSearchChange(safeValue);
  }

  function selectSuggestion(
    value
  ) {
    const selected =
      String(value ?? "").trim();

    if (!selected) {
      return;
    }

    updateSearch(selected);

    setMessage(
      t("search.showing", {
        query: selected
      })
    );

    stopSpeaking();
    setAssistantOpen(false);
  }

  function clearSearch() {
    updateSearch("");
    setMessage(
      t("search.prompt")
    );
  }

  function stopSpeaking() {
    cancelSpeech(window);
    setSpeaking(false);
  }

  function toggleSpeech() {
    if (speaking) {
      stopSpeaking();
      return;
    }

    disposeRecognition();
    setListening(false);

    try {
      const session =
        speakText({
          runtime: window,
          text: message,
          language:
            localeMeta.intlLocale,
          onStart: () => {
            setSpeaking(true);
          },
          onEnd: () => {
            setSpeaking(false);
          },
          onError: () => {
            setSpeaking(false);
            setMessage(
              t("search.ttsError")
            );
            setAssistantOpen(true);
          },
        });

      if (!session) {
        setSpeaking(false);
        setMessage(
          t(
            "search.ttsUnsupported"
          )
        );
        setAssistantOpen(true);
        return;
      }

      setSpeaking(true);
    } catch {
      setSpeaking(false);
      setMessage(
        t("search.ttsError")
      );
      setAssistantOpen(true);
    }
  }

  function startVoice() {
    stopSpeaking();

    if (
      recognitionRef.current
    ) {
      return;
    }

    let recognition;

    try {
      recognition =
        createSpeechRecognition({
          runtime: window,
          language:
            localeMeta.intlLocale
        });
    } catch {
      setMessage(
        t("search.voiceError")
      );
      setAssistantOpen(true);
      return;
    }

    if (!recognition) {
      setMessage(
        t(
          "search.voiceUnsupported"
        )
      );
      setAssistantOpen(true);
      return;
    }

    recognitionRef.current =
      recognition;

    recognition.onstart = () => {
      setListening(true);
      setMessage(
        t(
          "search.voiceListening"
        )
      );
      setAssistantOpen(true);
    };

    recognition.onresult = (
      event
    ) => {
      const transcript =
        event.results?.[0]?.[0]
          ?.transcript?.trim() ||
        "";

      if (!transcript) {
        return;
      }

      updateSearch(transcript);

      setMessage(
        t(
          "search.voiceSearching",
          {
            query: transcript
          }
        )
      );
    };

    recognition.onerror = () => {
      setMessage(
        t("search.voiceError")
      );
      setAssistantOpen(true);
    };

    recognition.onend = () => {
      if (
        recognitionRef.current ===
        recognition
      ) {
        recognitionRef.current =
          null;
      }

      setListening(false);
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current =
        null;

      setListening(false);

      setMessage(
        t("search.voiceError")
      );

      setAssistantOpen(true);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        marginBottom: "15px"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 12px",
          border:
            "1px solid var(--color-border-light)",
          borderRadius:
            "var(--radius-md)",
          background:
            "var(--color-white)",
          boxShadow:
            "var(--shadow-sm)"
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) =>
            updateSearch(
              event.target.value
            )
          }
          placeholder={t(
            "search.placeholder"
          )}
          aria-label={t(
            "search.aria"
          )}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background:
              "transparent",
            color:
              "var(--color-text-primary)",
            fontFamily:
              "var(--font-family-body)",
            fontSize:
              "var(--font-size-md)"
          }}
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label={t(
              "search.clearAria"
            )}
            style={
              iconButtonStyle
            }
          >
            <FaTimes />
          </button>
        )}

        <button
          type="button"
          onClick={startVoice}
          disabled={listening}
          aria-label={t(
            "search.voiceAria"
          )}
          aria-pressed={listening}
          style={{
            ...iconButtonStyle,
            color: listening
              ? "var(--color-danger)"
              : "var(--color-wine-800)"
          }}
        >
          <FaMicrophone />
        </button>

        <button
          type="button"
          onClick={() => {
            if (assistantOpen) {
              stopSpeaking();
            }

            setAssistantOpen(
              !assistantOpen
            );
          }}
          aria-label={t(
            "search.aiOpenAria"
          )}
          aria-expanded={
            assistantOpen
          }
          style={{
            ...iconButtonStyle,
            color:
              "var(--color-gold-700)"
          }}
        >
          <FaMagic />
        </button>
      </div>

      {assistantOpen && (
        <div
          role="dialog"
          aria-label={t(
            "search.aiDialogAria",
            {
              brand:
                BRAND.shortName
            }
          )}
          style={{
            position: "absolute",
            top:
              "calc(100% + 8px)",
            right: 0,
            left: 0,
            zIndex: 120,
            padding: "14px",
            border:
              "1px solid var(--color-gold-300)",
            borderRadius:
              "var(--radius-md)",
            background:
              "var(--color-white)",
            boxShadow:
              "var(--shadow-lg)"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: "12px",
              marginBottom:
                "8px"
            }}
          >
            <strong
              style={{
                color:
                  "var(--color-wine-800)"
              }}
            >
              {BRAND.shortName} AI
            </strong>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <button
                type="button"
                onClick={
                  toggleSpeech
                }
                aria-label={t(
                  speaking
                    ? "search.ttsStopAria"
                    : "search.ttsAria"
                )}
                aria-pressed={
                  speaking
                }
                style={{
                  ...iconButtonStyle,
                  color: speaking
                    ? "var(--color-danger)"
                    : "var(--color-wine-800)"
                }}
              >
                {speaking ? (
                  <FaStop />
                ) : (
                  <FaVolumeUp />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setAssistantOpen(
                    false
                  );
                }}
                aria-label={t(
                  "search.aiCloseAria"
                )}
                style={
                  iconButtonStyle
                }
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <p
            aria-live="polite"
            style={{
              margin:
                "0 0 12px",
              color:
                "var(--color-text-secondary)",
              fontSize:
                "var(--font-size-sm)"
            }}
          >
            {message}
          </p>

          {visibleSuggestions
            .length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px"
              }}
            >
              {visibleSuggestions.map(
                (suggestion) => (
                  <button
                    key={
                      suggestion
                    }
                    type="button"
                    onClick={() =>
                      selectSuggestion(
                        suggestion
                      )
                    }
                    style={{
                      padding:
                        "7px 10px",
                      border:
                        "1px solid var(--color-gold-300)",
                      borderRadius:
                        "var(--radius-pill)",
                      background:
                        "var(--color-gold-100)",
                      color:
                        "var(--color-wine-800)",
                      cursor:
                        "pointer"
                    }}
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const iconButtonStyle = {
  width: "44px",
  height: "44px",
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius:
    "var(--radius-pill)",
  background: "transparent",
  cursor: "pointer",
  fontSize: "18px"
};

export default SearchAI;
