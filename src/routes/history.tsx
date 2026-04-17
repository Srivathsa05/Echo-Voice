import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Mic, Calendar, Clock, ChevronRight, FileAudio } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Echo" },
      { name: "description", content: "Browse past consultations, summaries, and follow-up questions." },
      { property: "og:title", content: "Consultation history — Echo" },
      { property: "og:description", content: "Search and review every visit." },
    ],
  }),
  component: History,
});

const items = [
  { id: 1, title: "Diabetes follow-up", doctor: "Dr. Mehta", date: "14 Apr", duration: "6m 12s", tag: "Endocrinology", urgent: false },
  { id: 2, title: "Chest pain assessment", doctor: "Dr. Iyer", date: "02 Apr", duration: "11m 04s", tag: "Cardiology", urgent: true },
  { id: 3, title: "Pediatric checkup — Aarav", doctor: "Dr. Singh", date: "28 Mar", duration: "4m 30s", tag: "Pediatrics", urgent: false },
  { id: 4, title: "Allergy panel review", doctor: "Dr. Rao", date: "19 Mar", duration: "8m 21s", tag: "General", urgent: false },
  { id: 5, title: "Post-op recovery", doctor: "Dr. Khan", date: "11 Mar", duration: "5m 47s", tag: "Surgery", urgent: false },
  { id: 6, title: "Hypertension review", doctor: "Dr. Mehta", date: "02 Mar", duration: "7m 18s", tag: "Cardiology", urgent: false },
];

const filters = ["All", "Endocrinology", "Cardiology", "Pediatrics", "Surgery", "General"];

function History() {
  const [active, setActive] = useState("All");
  const [q, setQ] = useState("");

  const list = items.filter(
    (i) => (active === "All" || i.tag === active) &&
           (q === "" || i.title.toLowerCase().includes(q.toLowerCase()) || i.doctor.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-4 pt-10 pb-24">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Consultation history</h1>
            <p className="text-muted-foreground mt-1">{items.length} consultations · 42m 52s recorded</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search consultations..." className="glass pl-9 w-64 border-glass-border" />
            </div>
            <Button variant="outline" size="icon" className="glass border-glass-border" aria-label="Voice search">
              <Mic className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <motion.button
              key={f}
              onClick={() => setActive(f)}
              whileTap={{ scale: 0.95 }}
              className={`px-3.5 py-1.5 text-sm rounded-full border transition-all ${
                active === f
                  ? "gradient-primary text-primary-foreground border-transparent shadow-glow"
                  : "glass border-glass-border hover:border-primary/40"
              }`}
            >
              {f}
            </motion.button>
          ))}
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <GlassCard className="p-5 cursor-pointer group h-full hover:shadow-elegant transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl gradient-primary text-primary-foreground grid place-items-center">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  {c.urgent && <Badge className="bg-alert/15 text-alert border-alert/30 hover:bg-alert/15">Urgent</Badge>}
                </div>
                <h3 className="font-semibold leading-tight">{c.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{c.doctor}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                  <Badge variant="outline" className="font-normal">{c.tag}</Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {list.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">No consultations match.</div>
        )}
      </main>
    </div>
  );
}
