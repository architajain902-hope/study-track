// Smart Audio Dumping — transcribes voice-recorded thoughts via the Web Speech
// API (free, in-browser; Chrome/Edge support it) and formats them as todos.

export function speechSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createRecognizer({ onResult, onEnd, lang = 'en-IN' }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = lang;
  rec.onresult = (ev) => {
    let final = '';
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
      const res = ev.results[i];
      if (res.isFinal) final += res[0].transcript;
      else interim += res[0].transcript;
    }
    onResult({ final, interim });
  };
  rec.onend = () => onEnd && onEnd();
  rec.onerror = () => onEnd && onEnd();
  return rec;
}

// Break spoken text into task-shaped lines.
export function transcriptToCandidates(text = '') {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const parts = normalized
    .split(/(?<=[.!?])\s+|\n/)
    .map((s) => s.trim().replace(/^[-•*\u2022\s]+/, '').replace(/^and |^then /i, ''))
    .filter((s) => s.length >= 4);
  return parts.slice(0, 12);
}