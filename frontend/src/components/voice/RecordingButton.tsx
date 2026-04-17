import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordingButtonProps {
  recording: boolean;
  onClick: () => void;
  className?: string;
}

export function RecordingButton({ recording, onClick, className }: RecordingButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={recording ? "Stop recording" : "Start recording"}
      className={cn("relative grid place-items-center", className)}
    >
      {recording && (
        <>
          <span className="absolute inset-0 rounded-full bg-alert/40 animate-ripple" />
          <span className="absolute inset-0 rounded-full bg-alert/30 animate-ripple [animation-delay:0.5s]" />
        </>
      )}
      <motion.span
        animate={recording ? { scale: [1, 1.06, 1] } : { scale: [1, 1.04, 1] }}
        transition={{ duration: recording ? 1.2 : 3, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "relative grid place-items-center w-20 h-20 rounded-full text-primary-foreground",
          recording
            ? "bg-gradient-to-br from-alert to-warning shadow-[0_0_40px_oklch(0.7_0.18_22/0.6)]"
            : "gradient-primary shadow-glow",
        )}
      >
        {recording ? <Square className="w-7 h-7" fill="currentColor" /> : <Mic className="w-8 h-8" />}
      </motion.span>
    </button>
  );
}
