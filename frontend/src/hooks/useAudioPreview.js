import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const FADE_MS = 350;

/**
 * Hover-to-preview playback for a 30s iTunes clip, with a volume fade in/out
 * instead of an abrupt start/stop. One `<audio>` element is created lazily
 * and reused for the lifetime of the hook, so re-hovering the same (or a
 * different) preview never layers clips on top of each other.
 *
 * Usage: bind `onMouseEnter(url)` / `onMouseLeave(url)` to whatever element
 * should trigger playback, and check `isPlaying(url)` to render a "now
 * playing" state. Call `stop()` whenever the thing the preview belongs to
 * goes away (e.g. the caller swaps to a different song) — the hook has no
 * way to know that on its own, since hovering isn't guaranteed to fire a
 * mouseleave when the underlying element is swapped out from under the
 * cursor rather than actually being moved away from.
 */
export function useAudioPreview() {
  const [playingUrl, setPlayingUrl] = useState(null);
  const reduceMotion = useReducedMotion();
  const audioRef = useRef(null);
  const currentSrcRef = useRef(null);
  const fadeRafRef = useRef(null);

  function getAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setPlayingUrl(null));
      // A preview link can fail to load (expired URL, network hiccup,
      // territory restriction) after we've already optimistically shown
      // the "playing" state — without this, the UI would get stuck
      // showing it for a clip that silently never started.
      audioRef.current.addEventListener("error", () => setPlayingUrl(null));
    }
    return audioRef.current;
  }

  // Ramps `audio.volume` from its current value to `to` over `duration`ms.
  // Used for both fade-in and fade-out, so a preview never abruptly starts
  // or stops — and if a fade is interrupted partway (quick re-hover), it
  // continues smoothly from wherever it currently is rather than jumping.
  function fadeVolume(audio, to, duration, onDone) {
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);

    // Zero duration (reduced-motion) would otherwise divide by zero below.
    if (duration <= 0) {
      audio.volume = Math.min(1, Math.max(0, to));
      onDone?.();
      return;
    }

    const from = audio.volume;
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      // Clamp: `audio.volume` throws a RangeError for anything outside
      // [0, 1], and floating-point drift can otherwise nudge this a hair
      // past the edge — which would throw mid-frame and silently kill the
      // rest of the ramp.
      audio.volume = Math.min(1, Math.max(0, from + (to - from) * t));
      if (t < 1) {
        fadeRafRef.current = requestAnimationFrame(step);
      } else {
        fadeRafRef.current = null;
        onDone?.();
      }
    }
    fadeRafRef.current = requestAnimationFrame(step);
  }

  function enter(previewUrl) {
    if (!previewUrl) return;
    const audio = getAudio();

    if (currentSrcRef.current !== previewUrl) {
      currentSrcRef.current = previewUrl;
      audio.src = previewUrl;
      audio.currentTime = 0;
      audio.volume = 0;
    }

    audio.play().catch(() => setPlayingUrl(null));
    fadeVolume(audio, 1, reduceMotion ? 0 : FADE_MS);
    setPlayingUrl(previewUrl);
  }

  function leave(previewUrl) {
    setPlayingUrl((current) => (current === previewUrl ? null : current));
    const audio = audioRef.current;
    if (!audio) return;
    fadeVolume(audio, 0, reduceMotion ? 0 : FADE_MS, () => audio.pause());
  }

  function stop() {
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    audioRef.current?.pause();
    setPlayingUrl(null);
  }

  useEffect(() => stop, []);

  return {
    isPlaying: (url) => Boolean(url) && playingUrl === url,
    onMouseEnter: (url) => () => enter(url),
    onMouseLeave: (url) => () => leave(url),
    stop,
  };
}
