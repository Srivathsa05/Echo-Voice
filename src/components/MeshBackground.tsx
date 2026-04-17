import { motion } from "framer-motion";

export function MeshBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: "var(--gradient-mesh)" }}
      />
      {/* Floating medical particles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${(i * 73) % 100}%`,
            top: `${(i * 41) % 100}%`,
            width: `${6 + (i % 4) * 4}px`,
            height: `${6 + (i % 4) * 4}px`,
            background:
              i % 2 === 0
                ? "oklch(0.62 0.11 185 / 0.25)"
                : "oklch(0.62 0.18 252 / 0.22)",
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, i % 2 === 0 ? 20 : -20, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 8 + (i % 5),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}
