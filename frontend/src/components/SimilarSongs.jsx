import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAudioPreview } from "../hooks/useAudioPreview.js";
import SoundBars from "./SoundBars.jsx";

// Same progressive fade-in as SimilarArtists' ArtistThumbnail: real-network
// image loads complete at different times, and fading each one in once
// it's actually decoded (instead of a hard cut from blank to loaded) keeps
// a slow thumbnail from looking stalled.
function SongThumbnail({ track, preview, reduceMotion }) {
  const [loaded, setLoaded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const isPlaying = preview.isPlaying(track.previewUrl);

  return (
    <div
      className="relative h-32 w-32 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10"
      onMouseEnter={() => {
        setHovering(true);
        if (track.previewUrl) preview.onMouseEnter(track.previewUrl)();
      }}
      onMouseLeave={() => {
        setHovering(false);
        if (track.previewUrl) preview.onMouseLeave(track.previewUrl)();
      }}
    >
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/10" />}
      <motion.img
        src={track.artworkUrl}
        alt=""
        onLoad={() => setLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
      />
      {track.previewUrl && (
        // pointer-events-none for the same reason as the main board's
        // overlay: a transparent layer sitting on top of the image would
        // otherwise silently intercept right-click/drag on it even while
        // invisible. Visibility is state-driven, not CSS :hover, because a
        // non-interactive element can't receive its own hover events.
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/50
                      text-white transition-opacity duration-150 ${
                        hovering || isPlaying ? "opacity-100" : "opacity-0"
                      }`}
        >
          {isPlaying ? (
            <SoundBars reduceMotion={reduceMotion} className="h-5" />
          ) : (
            <span className="text-[10px] font-medium uppercase tracking-wide">Preview</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function SimilarSongs({ artists, onSelect }) {
  const preview = useAudioPreview();
  const reduceMotion = useReducedMotion();

  // Stop any playing preview whenever the underlying similar-artists data
  // changes (i.e. a new artist is being explored) — this list is about to
  // be replaced, so a track from the previous context shouldn't keep
  // playing under it.
  useEffect(() => {
    preview.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artists]);

  const tracks = (artists || []).map((a) => a.topTrack).filter(Boolean);

  if (tracks.length === 0) {
    return (
      <p className="text-sm text-white/40">
        No previewable tracks found for these artists — try another search.
      </p>
    );
  }

  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
      {tracks.map((t) => (
        <motion.button
          key={`${t.artist}-${t.id}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(t)}
          className="group flex w-32 flex-none flex-col items-start gap-2 text-left"
        >
          <SongThumbnail track={t} preview={preview} reduceMotion={reduceMotion} />
          <span className="line-clamp-2 text-sm font-medium leading-tight">{t.track}</span>
          <span className="line-clamp-1 text-xs text-white/50">{t.artist}</span>
        </motion.button>
      ))}
    </div>
  );
}
