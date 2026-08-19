import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "./components/SearchBar.jsx";
import UploadZone from "./components/UploadZone.jsx";
import MoodBoard from "./components/MoodBoard.jsx";
import AmbientBackground from "./components/AmbientBackground.jsx";
import EmptyStateHero from "./components/EmptyStateHero.jsx";
import { getPaletteForUrl, getPaletteForFile, getSimilarArtists } from "./api.js";

function emptyBoard() {
  return {
    artworkUrl: null,
    title: "",
    subtitle: "",
    artistName: null, // null = unknown (upload flow before identification)
    swatches: [],
    moodLabel: "",
    similarArtists: [],
    // 30s iTunes preview clip — only present for a song search result.
    // Albums, uploads, and similar-artist picks have no per-track preview.
    previewUrl: null,
  };
}

export default function App() {
  const [board, setBoard] = useState(emptyBoard());
  const [swatchesLoading, setSwatchesLoading] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasBoard, setHasBoard] = useState(false);

  const loadSimilar = useCallback(async (artistName) => {
    if (!artistName) return;
    setSimilarLoading(true);
    try {
      const results = await getSimilarArtists(artistName);
      setBoard((b) => ({ ...b, similarArtists: results }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSimilarLoading(false);
    }
  }, []);

  const loadPaletteFromUrl = useCallback(async (imageUrl) => {
    setSwatchesLoading(true);
    try {
      const { swatches, moodLabel } = await getPaletteForUrl(imageUrl);
      setBoard((b) => ({ ...b, swatches, moodLabel }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSwatchesLoading(false);
    }
  }, []);

  async function handleSelectSearchResult(result) {
    setError(null);
    setHasBoard(true);
    setBoard({
      ...emptyBoard(),
      artworkUrl: result.artworkUrl,
      title: result.album,
      subtitle: result.artist,
      artistName: result.artist,
      previewUrl: result.previewUrl ?? null,
    });
    loadPaletteFromUrl(result.artworkUrl);
    loadSimilar(result.artist);
  }

  async function handleUploadFile(file) {
    setError(null);
    setHasBoard(true);
    const localUrl = URL.createObjectURL(file);
    setBoard({
      ...emptyBoard(),
      artworkUrl: localUrl,
      title: file.name.replace(/\.[^.]+$/, ""),
      subtitle: "Your upload",
      artistName: null,
    });

    setSwatchesLoading(true);
    try {
      const { swatches, moodLabel } = await getPaletteForFile(file);
      setBoard((b) => ({ ...b, swatches, moodLabel }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSwatchesLoading(false);
    }
  }

  async function handleIdentifyArtist(name) {
    setBoard((b) => ({ ...b, artistName: name, subtitle: name }));
    loadSimilar(name);
  }

  async function handleSelectSimilar(artist) {
    setError(null);
    // Trust the backend's imageUrl as-is, including its absence: it already
    // runs an artist-verified iTunes lookup (see
    // itunesService.findArtworkForArtist). Falling back to the previous
    // board's artwork here would risk showing the wrong cover under a new
    // artist's name — no artwork is preferable to a wrong one.
    const artworkUrl = artist.imageUrl ?? null;

    setBoard((b) => ({
      ...b,
      artworkUrl,
      title: artist.name,
      subtitle: "Similar artist",
      artistName: artist.name,
      swatches: [],
      moodLabel: "",
      // Last.fm similar-artist results carry no per-track preview.
      previewUrl: null,
    }));

    if (artworkUrl) loadPaletteFromUrl(artworkUrl);
    loadSimilar(artist.name);
  }

  return (
    <div className="relative min-h-screen text-white lg:h-screen lg:overflow-hidden">
      {/* Fixed, viewport-covering — sits behind everything regardless of
          where the scrollable content below ends up. */}
      <AmbientBackground hexes={board.swatches?.map((s) => s.hex)} />

      <div
        className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-10
                   sm:px-8 lg:h-screen lg:max-w-7xl lg:flex-row lg:items-stretch lg:gap-14 lg:px-12 lg:py-0"
      >
        {/* Sidebar: identity + input. Fixed width and vertically centered
            on desktop so it reads as a panel, not a stacked section. */}
        <div className="flex flex-none flex-col items-center gap-6 text-center lg:w-[380px] lg:items-start lg:justify-center lg:text-left">
          <header className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-display text-[clamp(2.25rem,4vw,3rem)] font-medium leading-none">
              moodtune
            </h1>
            <p className="max-w-sm text-white/50">
              Turn any album cover into a color palette, a mood, and a path to your next favorite artist.
            </p>
          </header>

          <div className="flex w-full flex-col items-center gap-4 lg:items-start">
            <SearchBar onSelect={handleSelectSearchResult} />
            <UploadZone onFile={handleUploadFile} />
          </div>

          {error && (
            <div className="w-full rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Results panel: owns the rest of the viewport on desktop and
            scrolls independently if content ever runs tall, so the sidebar
            never moves. */}
        <div className="mood-scroll flex min-h-0 w-full flex-1 items-center justify-center lg:h-full lg:overflow-y-auto lg:py-10">
          <AnimatePresence mode="wait">
            {hasBoard ? (
              <motion.div
                key="board"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <MoodBoard
                  artworkUrl={board.artworkUrl}
                  title={board.title}
                  subtitle={board.subtitle}
                  moodLabel={board.moodLabel}
                  previewUrl={board.previewUrl}
                  swatches={board.swatches}
                  swatchesLoading={swatchesLoading}
                  similarArtists={board.similarArtists}
                  similarLoading={similarLoading}
                  unknownArtist={board.artistName === null}
                  onIdentifyArtist={handleIdentifyArtist}
                  onSelectSimilar={handleSelectSimilar}
                  onSelectSong={handleSelectSearchResult}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EmptyStateHero />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
