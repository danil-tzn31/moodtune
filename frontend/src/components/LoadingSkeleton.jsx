export function SwatchesSkeleton() {
  return (
    <div className="flex gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 w-16 flex-none animate-pulse rounded-2xl bg-white/10" />
      ))}
    </div>
  );
}

export function SimilarArtistsSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex w-32 flex-none flex-col gap-2">
          <div className="h-32 w-32 animate-pulse rounded-xl bg-white/10" />
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
