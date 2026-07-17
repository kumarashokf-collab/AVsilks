import { useMemo, useRef, useState } from "react";
import {
  FaMagic,
  FaMicrophone,
  FaTimes
} from "react-icons/fa";

import { BRAND } from "../config/branding";

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
  const recognitionRef = useRef(null);

  const [query, setQuery] = useState("");
  const [assistantOpen, setAssistantOpen] =
    useState(false);
  const [listening, setListening] =
    useState(false);
  const [message, setMessage] = useState(
    "మీకు కావాల్సిన చీర పేరు, రంగు లేదా కేటగిరీని వెతకండి."
  );

  const visibleSuggestions = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return suggestions.slice(0, 4);
    }

    return suggestions
      .filter((item) =>
        item
          .toLowerCase()
          .includes(normalizedQuery)
      )
      .slice(0, 4);
  }, [query, suggestions]);

  function updateSearch(value) {
    setQuery(value);
    onSearchChange(value);
  }

  function selectSuggestion(value) {
    updateSearch(value);
    setMessage(
      `"${value}"కు సంబంధించిన చీరలను చూపిస్తున్నాను.`
    );
    setAssistantOpen(false);
  }

  function clearSearch() {
    updateSearch("");
    setMessage(
      "మీకు కావాల్సిన చీర పేరు, రంగు లేదా కేటగిరీని వెతకండి."
    );
  }

  function startVoice() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage(
        "ఈ browserలో voice search support లేదు. దయచేసి search boxలో టైప్ చేయండి."
      );
      setAssistantOpen(true);
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "te-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      setMessage(
        "వింటున్నాను... మీకు కావాల్సిన చీర గురించి చెప్పండి."
      );
      setAssistantOpen(true);
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript
          ?.trim() || "";

      if (transcript) {
        updateSearch(transcript);
        setMessage(
          `"${transcript}" కోసం సరైన చీరలను వెతుకుతున్నాను.`
        );
      }
    };

    recognition.onerror = () => {
      setMessage(
        "Voice search పూర్తికాలేదు. మళ్లీ ప్రయత్నించండి లేదా టైప్ చేయండి."
      );
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
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
          borderRadius: "var(--radius-md)",
          background: "var(--color-white)",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) =>
            updateSearch(event.target.value)
          }
          placeholder="చీరల కోసం వెతకండి..."
          aria-label="Search sarees"
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            color:
              "var(--color-text-primary)",
            fontFamily:
              "var(--font-family-body)",
            fontSize: "var(--font-size-md)"
          }}
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            style={iconButtonStyle}
          >
            <FaTimes />
          </button>
        )}

        <button
          type="button"
          onClick={startVoice}
          aria-label="Start voice search"
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
          onClick={() =>
            setAssistantOpen((open) => !open)
          }
          aria-label="Open AI search assistant"
          aria-expanded={assistantOpen}
          style={{
            ...iconButtonStyle,
            color: "var(--color-gold-700)"
          }}
        >
          <FaMagic />
        </button>
      </div>

      {assistantOpen && (
        <div
          role="dialog"
          aria-label={`${BRAND.shortName} AI assistant`}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            left: 0,
            zIndex: 120,
            padding: "14px",
            border:
              "1px solid var(--color-gold-300)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-white)",
            boxShadow: "var(--shadow-lg)"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "12px",
              marginBottom: "8px"
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

            <button
              type="button"
              onClick={() =>
                setAssistantOpen(false)
              }
              aria-label="Close AI assistant"
              style={iconButtonStyle}
            >
              <FaTimes />
            </button>
          </div>

          <p
            style={{
              margin: "0 0 12px",
              color:
                "var(--color-text-secondary)",
              fontSize: "var(--font-size-sm)"
            }}
          >
            {message}
          </p>

          {visibleSuggestions.length > 0 && (
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
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      selectSuggestion(
                        suggestion
                      )
                    }
                    style={{
                      padding: "7px 10px",
                      border:
                        "1px solid var(--color-gold-300)",
                      borderRadius:
                        "var(--radius-pill)",
                      background:
                        "var(--color-gold-100)",
                      color:
                        "var(--color-wine-800)",
                      cursor: "pointer"
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
  width: "38px",
  height: "38px",
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: "var(--radius-pill)",
  background: "transparent",
  cursor: "pointer",
  fontSize: "18px"
};

export default SearchAI;
