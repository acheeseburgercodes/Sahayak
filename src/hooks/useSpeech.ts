import { useCallback, useEffect, useRef, useState } from 'react';
import type { LangCode } from '../types';
import { sarvamAvailable, sarvamSpeak, sarvamTranscribe, stripMarkup } from '../lib/sarvam';

/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Voice in and voice out. This is the accessibility feature that matters most
 * here: a user who cannot read still has a full path through the app.
 *
 * Input:  Web Speech API when the browser has it (free, instant), otherwise
 *         MediaRecorder + Sarvam Saarika.
 * Output: Sarvam Bulbul when a key is configured (far better Indic prosody),
 *         otherwise the browser's own speechSynthesis.
 */
export function useSpeech() {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const sttSupported = Boolean(recognitionCtor()) || sarvamAvailable();

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    cleanupAudio();
    setSpeaking(false);
  }, [cleanupAudio]);

  const speak = useCallback(
    async (text: string, lang: LangCode) => {
      const clean = stripMarkup(text);
      if (!clean) return;
      stopSpeaking();
      setSpeaking(true);

      const url = await sarvamSpeak(clean, lang);
      if (url) {
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setSpeaking(false);
          cleanupAudio();
        };
        audio.onerror = () => {
          setSpeaking(false);
          cleanupAudio();
        };
        try {
          await audio.play();
          return;
        } catch {
          cleanupAudio();
        }
      }

      // Browser fallback.
      if (!('speechSynthesis' in window)) {
        setSpeaking(false);
        return;
      }
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = lang;
      utter.rate = 0.95;
      const match = window.speechSynthesis.getVoices().find((v) => v.lang === lang);
      if (match) utter.voice = match;
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utter);
    },
    [cleanupAudio, stopSpeaking],
  );

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop();
    setListening(false);
    setInterim('');
  }, []);

  const startListening = useCallback(
    async (lang: LangCode, onFinal: (text: string) => void) => {
      setMicError(null);
      const Ctor = recognitionCtor();

      if (Ctor) {
        const rec = new Ctor();
        rec.lang = lang;
        rec.continuous = false;
        rec.interimResults = true;
        rec.onresult = (e: any) => {
          let finalText = '';
          let partial = '';
          for (let i = e.resultIndex; i < e.results.length; i += 1) {
            const r = e.results[i];
            if (r.isFinal) finalText += r[0].transcript;
            else partial += r[0].transcript;
          }
          setInterim(partial);
          if (finalText.trim()) {
            onFinal(finalText.trim());
            setInterim('');
          }
        };
        rec.onerror = (e: any) => {
          setMicError(
            e?.error === 'not-allowed'
              ? 'Microphone permission was refused. Allow it in the address bar, or type instead.'
              : 'Could not hear you. Try again, or type instead.',
          );
          setListening(false);
        };
        rec.onend = () => setListening(false);
        recRef.current = rec;
        try {
          rec.start();
          setListening(true);
        } catch {
          setMicError('Microphone is already in use.');
        }
        return;
      }

      // Recording fallback → Sarvam speech-to-text.
      if (!sarvamAvailable() || !navigator.mediaDevices?.getUserMedia) {
        setMicError('Voice input is not available in this browser. Please type your question.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];
        const rec = new MediaRecorder(stream);
        mediaRef.current = rec;
        rec.ondataavailable = (e) => {
          if (e.data.size) chunksRef.current.push(e.data);
        };
        rec.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const out = await sarvamTranscribe(blob, lang);
          if (out?.text) onFinal(out.text);
          else setMicError('Could not understand the recording. Please try again or type.');
          setListening(false);
        };
        rec.start();
        setListening(true);
        // Hard stop so the mic is never left open.
        window.setTimeout(() => {
          if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
        }, 15000);
      } catch {
        setMicError('Microphone permission was refused. Please type your question.');
        setListening(false);
      }
    },
    [],
  );

  useEffect(() => () => {
    stopSpeaking();
    stopListening();
  }, [stopListening, stopSpeaking]);

  return {
    listening,
    speaking,
    interim,
    micError,
    sttSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearMicError: () => setMicError(null),
  };
}
