import { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function UploadZone({ onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files) {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFile(file);
    }
  }

  return (
    <motion.div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl
                  border border-dashed px-6 py-4 text-center text-sm transition-colors
                  ${dragging ? "border-white/60 bg-white/10" : "border-white/20 bg-white/[0.03] hover:bg-white/[0.06]"}`}
    >
      <span className="text-white/70">Or drop your own album art here</span>
      <span className="text-xs text-white/40">PNG or JPG, up to 8MB</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </motion.div>
  );
}
