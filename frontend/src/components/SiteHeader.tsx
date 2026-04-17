import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="glass-strong mx-auto max-w-6xl rounded-2xl px-4 py-2.5 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              activeProps={{ className: "px-3 py-1.5 text-sm font-medium rounded-lg text-foreground bg-accent/60" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" className="gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-90">
          <Link to="/dashboard">
            Launch <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
