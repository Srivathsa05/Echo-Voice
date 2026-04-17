import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceWaveProps {
  bars?: number;
  active?: boolean;
  className?: string;
}

export function VoiceWave({ bars = 28, active = true, className }: VoiceWaveProps) {
  return (
    <div className={cn("flex items-center justify-center gap-1 h-16", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-primary to-trust"
          animate={
            active
              ? { scaleY: [0.3, 1, 0.5, 0.9, 0.4, 1, 0.3] }
              : { scaleY: 0.3 }
          }
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
          style={{ height: "100%", transformOrigin: "center" }}
        />
      ))}
    </div>
  );
}
