import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchMusic } from "../api.js";

// Hover-preview playback lives on the main mood board (see
// MoodBoard.jsx and useAudioPreview.js), not in this dropdown.
// `previewUrl` flows through each result object here so it can reach the
// board once a song is selected; this component just passes it along via
// onSelect without playing anything itself.

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchMusic(query.trim());
        setResults(data);
        setOpen(true);
      } catch (err) {
        setError(err.message);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="relative w-full max-w-xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search an artist or album…"
        className="w-full rounded-full bg-white/5 border border-white/10 px-6 py-4 text-lg
                   placeholder-white/40 outline-none backdrop-blur-md
                   focus:border-white/30 focus:bg-white/10 transition-colors"
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10
                       bg-[#151320]/95 backdrop-blur-xl shadow-2xl"
          >
            {loading && (
              <div className="px-5 py-4 text-sm text-white/50">Searching…</div>
            )}
            {!loading && error && (
              <div className="px-5 py-4 text-sm text-red-300">{error}</div>
            )}
            {!loading && !error && results.length === 0 && (
              <div className="px-5 py-4 text-sm text-white/50">No matches yet — try another spelling.</div>
            )}
            {!loading &&
              results.slice(0, 8).map((r) => (
                <button
                  key={`${r.kind}-${r.id}`}
                  onClick={() => {
                    onSelect(r);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors"
                >
                  <img
                    src={r.artworkUrl}
                    alt=""
                    className="h-11 w-11 flex-none rounded-md object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block truncate text-sm font-medium">
                        {r.kind === "song" ? r.track : r.album}
                      </span>
                      <span className="flex-none rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/40">
                        {r.kind === "song" ? "Song" : "Album"}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-white/50">
                      {r.artist}
                      {r.kind === "song" ? ` · from ${r.album}` : ""}
                    </span>
                  </span>
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
