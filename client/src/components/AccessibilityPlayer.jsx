import { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { clamp, cx } from '../utils/format.js';

/**
 * Accessibility speech engine built on the native Web Speech API.
 *
 * Handles the API's real-world quirks:
 *  - `voiceschanged` fires asynchronously; the voice list is polled until ready
 *  - Chrome silently stops long utterances, so text is chunked on sentence
 *    boundaries and played as a queue
 *  - pause/resume is tracked per chunk so a resume always restarts cleanly
 */
const CHUNK_LIMIT = 220;

/** Splits narration into utterance-sized chunks without cutting words. */
function chunkText(text) {
  const sentences = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const chunks = [];
  let current = '';
  sentences.forEach((sentence) => {
    if (!current) {
      current = sentence;
    } else if (`${current} ${sentence}`.length <= CHUNK_LIMIT) {
      current = `${current} ${sentence}`;
    } else {
      chunks.push(current);
      current = sentence;
    }
    while (current.length > CHUNK_LIMIT) {
      const cut = current.lastIndexOf(' ', CHUNK_LIMIT);
      const splitAt = cut > 40 ? cut : CHUNK_LIMIT;
      chunks.push(current.slice(0, splitAt));
      current = current.slice(splitAt).trim();
    }
  });
  if (current) chunks.push(current);
  return chunks.length ? chunks : ['No narration is available for this scan.'];
}

export default function AccessibilityPlayer({
  text,
  title = 'Audio narration',
  disabled = false,
  compact = false
}) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voiceURI, setVoiceURI] = useState('');
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | playing | paused
  const [chunkIndex, setChunkIndex] = useState(0);

  const chunksRef = useRef([]);
  const queueRef = useRef({ current: null });
  const pausedRef = useRef(false);

  const totalChunks = chunksRef.current.length || chunkText(text).length;

  // ---- voice list -----------------------------------------------------------
  useEffect(() => {
    if (!supported) return undefined;

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) setVoices(list);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    // Safari sometimes needs a nudge before the list is populated.
    const timer = window.setTimeout(loadVoices, 400);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.clearTimeout(timer);
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    queueRef.current.current = null;
    pausedRef.current = false;
    setChunkIndex(0);
    setStatus('idle');
  }, [supported]);

  // Always release the speech engine when the component unmounts.
  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  // A new narration payload resets the queue.
  useEffect(() => {
    chunksRef.current = chunkText(text);
    setChunkIndex(0);
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const speakChunk = useCallback(
    (index) => {
      if (!supported) return;
      const chunk = chunksRef.current[index];
      if (!chunk) {
        setStatus('idle');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.rate = clamp(rate, 0.5, 2);
      utterance.pitch = clamp(pitch, 0, 2);
      utterance.volume = 1;
      utterance.lang = 'en-US';

      const selected = voices.find((voice) => voice.voiceURI === voiceURI);
      if (selected) {
        utterance.voice = selected;
        utterance.lang = selected.lang;
      }

      utterance.onstart = () => {
        pausedRef.current = false;
        setStatus('playing');
      };
      utterance.onend = () => {
        if (queueRef.current.current !== utterance) return;
        if (index + 1 < chunksRef.current.length) {
          setChunkIndex(index + 1);
          speakChunk(index + 1);
        } else {
          queueRef.current.current = null;
          setStatus('idle');
          setChunkIndex(0);
        }
      };
      utterance.onerror = (event) => {
        if (event.error === 'canceled' || event.error === 'interrupted') return;
        queueRef.current.current = null;
        setStatus('idle');
      };

      queueRef.current.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported, rate, pitch, voiceURI, voices]
  );

  const play = useCallback(() => {
    if (!supported || disabled) return;
    // Restart from the top if we are idle and finished.
    if (status === 'idle' && chunkIndex === 0) window.speechSynthesis.cancel();
    const from = window.speechSynthesis.paused ? 0 : chunkIndex;
    speakChunk(from);
  }, [supported, disabled, status, chunkIndex, speakChunk]);

  const pause = useCallback(() => {
    if (!supported || status !== 'playing') return;
    window.speechSynthesis.pause();
    pausedRef.current = true;
    setStatus('paused');
  }, [supported, status]);

  const resume = useCallback(() => {
    if (!supported || status !== 'paused') return;
    window.speechSynthesis.resume();
    pausedRef.current = false;
    setStatus('playing');
  }, [supported, status]);

  const restart = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setChunkIndex(0);
    // Give the engine a tick to clear before queueing the first chunk again.
    window.setTimeout(() => speakChunk(0), 60);
  }, [supported, speakChunk]);

  if (!supported) {
    return (
      <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
        This browser does not expose the Web Speech API. Enable narration in Chrome, Edge, or Safari.
      </div>
    );
  }

  const progress = totalChunks ? Math.round((chunkIndex / totalChunks) * 100) : 0;

  return (
    <section
      className={cx('card', compact && '!p-4')}
      aria-label="Accessibility speech player"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-vision-400" aria-hidden="true" />
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <span className="chip" aria-live="polite">
          {status === 'playing' ? 'Speaking' : status === 'paused' ? 'Paused' : 'Ready'}
          {totalChunks > 1 ? ` · ${chunkIndex + 1}/${totalChunks}` : ''}
        </span>
      </header>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-vision-400 transition-all duration-300"
          style={{ width: `${status === 'idle' ? 0 : Math.max(4, progress)}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {status !== 'playing' ? (
          <button type="button" onClick={status === 'paused' ? resume : play} disabled={disabled} className="btn-primary">
            {status === 'paused' ? <Play className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {status === 'paused' ? 'Resume' : 'Play audio'}
          </button>
        ) : (
          <button type="button" onClick={pause} className="btn-ghost">
            <Pause className="h-4 w-4" aria-hidden="true" />
            Pause
          </button>
        )}
        <button type="button" onClick={restart} disabled={disabled} className="btn-ghost">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Restart
        </button>
        <button type="button" onClick={stop} disabled={status === 'idle'} className="btn-danger">
          <Square className="h-4 w-4" aria-hidden="true" />
          Stop
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="speech-rate" className="label flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              Speech rate
            </span>
            <span className="font-mono text-vision-300">{rate.toFixed(1)}×</span>
          </label>
          <input
            id="speech-rate"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(event) => {
              setRate(Number(event.target.value));
              if (status !== 'idle') {
                restart();
              }
            }}
            aria-valuemin={0.5}
            aria-valuemax={2}
            aria-valuenow={rate}
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>0.5× slow</span>
            <span>2.0× fast</span>
          </div>
        </div>

        <div>
          <label htmlFor="speech-pitch" className="label flex items-center justify-between">
            <span>Voice pitch</span>
            <span className="font-mono text-vision-300">{pitch.toFixed(1)}</span>
          </label>
          <input
            id="speech-pitch"
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={pitch}
            onChange={(event) => {
              setPitch(Number(event.target.value));
              if (status !== 'idle') {
                restart();
              }
            }}
          />
        </div>
      </div>

      {voices.length > 0 && (
        <div className="mt-4">
          <label htmlFor="speech-voice" className="label">
            Narration voice
          </label>
          <select
            id="speech-voice"
            className="field"
            value={voiceURI}
            onChange={(event) => {
              setVoiceURI(event.target.value);
              if (status !== 'idle') restart();
            }}
          >
            <option value="">System default</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}
