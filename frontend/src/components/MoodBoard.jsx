import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import PaletteSwatches from "./PaletteSwatches.jsx";
import SimilarArtists from "./SimilarArtists.jsx";
import SimilarSongs from "./SimilarSongs.jsx";
import SoundBars from "./SoundBars.jsx";
import { SwatchesSkeleton, SimilarArtistsSkeleton } from "./LoadingSkeleton.jsx";
import { gradientFromSwatches } from "../utils/color.js";
import { useAudioPreview } from "../hooks/useAudioPreview.js";

function ArtistNamePrompt({ onSubmit }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className="flex max-w-sm gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Who made this? (artist name)"
        className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 text-sm placeholder-white/40 outline-none focus:bg-white/15"
      />
      <motion.button
        type="submit"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="flex-none rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black"
      >
        Find similar
      </motion.button>
    </form>
  );
}

export default function MoodBoard({
  artworkUrl,
  title,
  subtitle,
  moodLabel,
  previewUrl,
  swatches,
  swatchesLoading,
  similarArtists,
  similarLoading,
  unknownArtist,
  onIdentifyArtist,
  onSelectSimilar,
  onSelectSong,
}) {
  const hexes = swatches?.map((s) => s.hex) ?? [];
  const reduceMotion = useReducedMotion();
  const preview = useAudioPreview();
  const isPreviewPlaying = preview.isPlaying(previewUrl);
  const [isHoveringArt, setIsHoveringArt] = useState(false);
  const [exploreTab, setExploreTab] = useState("artists");

  // Stop any playing preview whenever the displayed cover changes. Hovering
  // relies on a real mouseleave to stop playback, but switching boards (a
  // new search, a similar-artist pick) swaps the image out from under an
  // already-stationary cursor without ever firing one.
  useEffect(() => {
    preview.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkUrl]);

  return (
    // This card stays mounted across board changes; only the image and
    // title block below crossfade individually. The one-time reveal
    // (empty → first board) is handled by the wrapper in App.jsx, so
    // switching artists here reads as one continuous transition rather
    // than the whole card rebuilding.
    <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
      {/* Animated palette-derived background */}
      <motion.div
        key={hexes.join("-")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 -z-10"
        style={{ background: gradientFromSwatches(hexes) }}
      />
      {/* No backdrop-blur here on purpose: this sits over the continuously
          animating ambient background (see AmbientBackground.jsx), and a
          live backdrop-filter recalculating every frame of that motion is
          expensive. The palette gradient above is opaque enough on its own
          for the glass look. */}
      <div className="absolute inset-0 -z-10 bg-black/45" />

      <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,240px)_1fr]">
        <div
          className="relative aspect-square w-full max-w-[240px] flex-none"
          onMouseEnter={() => {
            setIsHoveringArt(true);
            if (previewUrl) preview.onMouseEnter(previewUrl)();
          }}
          onMouseLeave={() => {
            setIsHoveringArt(false);
            if (previewUrl) preview.onMouseLeave(previewUrl)();
          }}
        >
          <AnimatePresence mode="wait">
            {artworkUrl ? (
              <motion.img
                key={artworkUrl}
                src={artworkUrl}
                alt={title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full w-full rounded-2xl object-cover shadow-2xl shadow-black/50 ring-1 ring-white/10"
              />
            ) : (
              // No verified art for this one (see itunesService.findArtworkForArtist) —
              // show an intentional placeholder rather than risk a wrong cover.
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex h-full w-full items-center justify-center rounded-2xl bg-white/5 text-4xl text-white/20 ring-1 ring-white/10"
              >
                ♪
              </motion.div>
            )}
          </AnimatePresence>

          {previewUrl && (
            // pointer-events-none so this purely-visual layer never steals
            // hit-testing from the image underneath (e.g. right-click "save
            // image as", drag-to-desktop) — visibility is driven entirely
            // by React state from the wrapper's own hover handlers above,
            // not a CSS :hover on this element, since a non-interactive
            // element can't receive its own hover events anyway.
            <div
              className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2
                          rounded-2xl bg-black/50 text-white transition-opacity duration-150 ${
                            isHoveringArt || isPreviewPlaying ? "opacity-100" : "opacity-0"
                          }`}
            >
              {isPreviewPlaying ? (
                <SoundBars reduceMotion={reduceMotion} className="h-6" />
              ) : (
                <span className="text-xs font-medium uppercase tracking-widest">Preview</span>
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm uppercase tracking-widest text-white/50">{subtitle}</p>
              <h2 className="truncate text-3xl font-semibold sm:text-4xl">{title}</h2>
              {moodLabel && (
                <p className="font-display mt-2 text-2xl italic text-white/90 sm:text-3xl">
                  “{moodLabel}”
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
              Palette
            </h3>
            {swatchesLoading ? (
              <SwatchesSkeleton />
            ) : artworkUrl ? (
              <PaletteSwatches swatches={swatches} />
            ) : (
              <p className="text-sm text-white/40">No cover art found for this one.</p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Keep exploring
              </h3>
              {/* Tabs only make sense once there's similar-artist data to
                  split between the two views. */}
              {!unknownArtist && !similarLoading && (
                <div className="flex gap-1 rounded-full bg-white/5 p-1 text-xs">
                  {["artists", "songs"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setExploreTab(tab)}
                      className={`relative rounded-full px-3 py-1 font-medium capitalize transition-colors ${
                        exploreTab === tab ? "text-black" : "text-white/60 hover:text-white/90"
                      }`}
                    >
                      {exploreTab === tab && (
                        <motion.span
                          layoutId="exploreTabIndicator"
                          className="absolute inset-0 rounded-full bg-white"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative">{tab}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {unknownArtist ? (
              <ArtistNamePrompt onSubmit={onIdentifyArtist} />
            ) : similarLoading ? (
              <SimilarArtistsSkeleton />
            ) : exploreTab === "songs" ? (
              <SimilarSongs artists={similarArtists} onSelect={onSelectSong} />
            ) : (
              <SimilarArtists artists={similarArtists} onSelect={onSelectSimilar} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
