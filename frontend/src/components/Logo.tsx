import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <motion.div
        whileHover={{ rotate: -8, scale: 1.05 }}
        className="relative w-10 h-10 rounded-xl gradient-primary grid place-items-center shadow-glow"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
          <path d="M3 12c2 0 2-4 4-4s2 8 4 8 2-12 4-12 2 8 4 8 2-4 2-4" />
        </svg>
      </motion.div>
      <span className="text-xl font-bold tracking-tight">
        <span className="gradient-text">Echo</span>
        <span className="text-muted-foreground font-normal text-sm ml-1.5">/health</span>
      </span>
    </Link>
  );
}
