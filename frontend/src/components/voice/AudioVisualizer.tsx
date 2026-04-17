import { motion } from "framer-motion";

interface AudioVisualizerProps {
  bars?: number;
  className?: string;
}

export function AudioVisualizer({ bars = 64, className }: AudioVisualizerProps) {
  return (
    <div className={`flex items-center justify-center gap-[3px] h-24 w-full ${className ?? ""}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const seed = (Math.sin(i * 1.7) + 1) / 2;
        return (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-primary via-trust to-primary-glow"
            animate={{ scaleY: [0.2 + seed * 0.3, 0.6 + seed * 0.4, 0.3 + seed * 0.2, 0.9, 0.4] }}
            transition={{ duration: 1.4 + seed, repeat: Infinity, ease: "easeInOut", delay: i * 0.02 }}
            style={{ height: "100%", transformOrigin: "center" }}
          />
        );
      })}
    </div>
  );
}
