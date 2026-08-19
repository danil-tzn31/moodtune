import { useState } from "react";
import { motion } from "framer-motion";

// Thumbnails load over the network at different speeds. Fading each image
// in once it's actually decoded, instead of a hard cut from blank to
// loaded, keeps a slower thumbnail from reading as a stalled animation —
// the pulse placeholder holds its place and the photo eases in over it.
function ArtistThumbnail({ imageUrl, alt }) {
  const [loaded, setLoaded] = useState(false);

  if (!imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center text-2xl text-white/20">
        ♪
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/10" />}
      <motion.img
        src={imageUrl}
        alt={alt}
        onLoad={() => setLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
      />
    </>
  );
}

export default function SimilarArtists({ artists, onSelect }) {
  if (!artists || artists.length === 0) {
    return (
      <p className="text-sm text-white/40">
        No similar artists found on Last.fm for this one — try another search.
      </p>
    );
  }

  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
      {artists.map((a) => (
        <motion.button
          key={a.name}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(a)}
          className="group flex w-32 flex-none flex-col items-start gap-2 text-left"
        >
          <div className="relative h-32 w-32 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
            <ArtistThumbnail imageUrl={a.imageUrl} alt="" />
          </div>
          <span className="line-clamp-2 text-sm font-medium leading-tight">{a.name}</span>
        </motion.button>
      ))}
    </div>
  );
}
