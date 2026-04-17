import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Mic, FileText, MessageCircleQuestion, Languages, Brain, CheckCircle2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { VoiceWave } from "@/components/voice/VoiceWave";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Echo — Never forget your care instructions" },
      { name: "description", content: "Voice-first AI that turns consultations into clear summaries, medications, and the questions you forgot to ask." },
      { property: "og:title", content: "Echo — Never forget your care instructions" },
      { property: "og:description", content: "From 80% forgotten to 0% with Echo." },
    ],
  }),
  component: Landing,
});

function useCountUp(target: number, duration = 1800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function Landing() {
  const forgotten = useCountUp(80);
  const withEcho = useCountUp(0);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative px-4 pt-16 pb-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <Badge variant="outline" className="glass rounded-full px-4 py-1.5 text-xs gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Built for high-volume rural clinics
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]"
          >
            Never forget your<br />
            <span className="gradient-text">care instructions.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 text-center text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Echo records doctor consultations and gives patients a clear summary,
            medication plan, and the questions they forgot to ask — in their own language.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-95 h-12 px-6 rounded-xl">
              <Link to="/dashboard">
                Try Echo now <ArrowRight className="ml-1.5 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass h-12 px-6 rounded-xl border-glass-border">
              <a href="#how">See how it works</a>
            </Button>
          </motion.div>

          {/* Voice wave card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="mt-14"
          >
            <GlassCard variant="strong" className="p-6 md:p-8 max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex w-2.5 h-2.5">
                    <span className="absolute inset-0 rounded-full bg-alert animate-ping opacity-70" />
                    <span className="relative w-2.5 h-2.5 rounded-full bg-alert" />
                  </span>
                  <span className="text-sm font-medium">Live transcription</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">0:42 / Hindi → English</span>
              </div>
              <VoiceWave bars={48} />
              <div className="mt-5 grid md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Doctor</p>
                  <p className="text-sm">Take metformin 500mg twice daily, after meals.</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 border border-primary/20">
                  <p className="text-xs text-primary mb-1">Echo summary</p>
                  <p className="text-sm">💊 Metformin · 500mg · 2× day · with food</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Stat counters */}
          <div className="mt-14 grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <GlassCard className="p-6 text-center">
              <p className="text-sm uppercase tracking-wider text-muted-foreground">Without Echo</p>
              <p className="mt-2 text-6xl font-bold font-mono text-alert">{forgotten}%</p>
              <p className="text-sm text-muted-foreground">forgotten in minutes</p>
            </GlassCard>
            <GlassCard className="p-6 text-center" glow>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">With Echo</p>
              <p className="mt-2 text-6xl font-bold font-mono gradient-text">{withEcho}%</p>
              <p className="text-sm text-muted-foreground">forgotten — ever</p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* BENTO FEATURES */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center tracking-tight">
            Built for the way patients <span className="gradient-text">actually remember.</span>
          </h2>
          <div className="mt-12 grid md:grid-cols-6 gap-4 auto-rows-[180px]">
            <FeatureCard className="md:col-span-4 md:row-span-2" icon={<Mic className="w-6 h-6" />} title="Voice capture" desc="One-tap recording. Works on the cheapest smartphone, with background noise tolerance built in.">
              <VoiceWave bars={32} className="mt-4" />
            </FeatureCard>
            <FeatureCard className="md:col-span-2" icon={<Brain className="w-6 h-6" />} title="AI summaries" desc="GPT-powered structured notes." />
            <FeatureCard className="md:col-span-2" icon={<MessageCircleQuestion className="w-6 h-6" />} title="Forgotten questions" desc="5–7 smart follow-ups, auto-generated." />
            <FeatureCard className="md:col-span-3" icon={<FileText className="w-6 h-6" />} title="Share anywhere" desc="WhatsApp, SMS, PDF — meet patients where they are." />
            <FeatureCard className="md:col-span-3" icon={<Languages className="w-6 h-6" />} title="12+ Indian languages" desc="Hindi, Tamil, Telugu, Bengali, Marathi, Kannada and more." />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center tracking-tight">How Echo works</h2>
          <p className="text-center text-muted-foreground mt-4">Three steps. Under two minutes.</p>

          <div className="mt-14 relative">
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-trust to-transparent md:-translate-x-1/2" />
            {[
              { n: "01", icon: <Mic className="w-5 h-5" />, title: "Record the consultation", desc: "Patient or staff hits record. Echo captures speaker, tone, and medical terms." },
              { n: "02", icon: <Brain className="w-5 h-5" />, title: "AI does the heavy lifting", desc: "Whisper transcribes. GPT-4o-mini structures it into diagnosis, meds, follow-ups." },
              { n: "03", icon: <CheckCircle2 className="w-5 h-5" />, title: "Patient gets clarity", desc: "A friendly summary, a medication timeline, and the questions they forgot — on WhatsApp or SMS." },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative pl-16 md:pl-0 md:grid md:grid-cols-2 md:gap-12 mb-10"
              >
                <div className={`md:text-right ${i % 2 === 1 ? "md:order-2 md:text-left" : ""}`}>
                  <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-0 w-12 h-12 rounded-full glass-strong grid place-items-center text-primary">
                    {s.icon}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">STEP {s.n}</span>
                  <h3 className="text-xl font-semibold mt-1">{s.title}</h3>
                </div>
                <div className={i % 2 === 1 ? "md:order-1" : ""}>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24">
        <GlassCard variant="strong" className="max-w-4xl mx-auto p-10 md:p-14 text-center" glow>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Give every patient a <span className="gradient-text">second chance</span> to remember.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Echo is free for community clinics. Set up takes under five minutes.
          </p>
          <Button asChild size="lg" className="mt-8 gradient-primary border-0 text-primary-foreground shadow-glow hover:opacity-95 h-12 px-8 rounded-xl">
            <Link to="/dashboard">Open the dashboard <ArrowRight className="ml-1.5 w-4 h-4" /></Link>
          </Button>
        </GlassCard>
      </section>

      <footer className="px-4 py-10 text-center text-sm text-muted-foreground">
        Echo · For high-volume healthcare · Made with care.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon, title, desc, children, className,
}: { icon: React.ReactNode; title: string; desc: string; children?: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`glass rounded-2xl p-6 flex flex-col hover:shadow-elegant transition-shadow ${className ?? ""}`}
    >
      <div className="w-11 h-11 rounded-xl gradient-primary text-primary-foreground grid place-items-center shadow-glow">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      {children}
    </motion.div>
  );
}
