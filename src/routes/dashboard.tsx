import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { AudioVisualizer } from "@/components/voice/AudioVisualizer";
import { RecordingButton } from "@/components/voice/RecordingButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Stethoscope, User as UserIcon } from "lucide-react";
import {
  Upload, FileAudio, CheckCircle2, Brain, AudioWaveform, Loader2,
  Pill, AlertCircle, CalendarClock, Bookmark, MessageSquarePlus,
  Download, MessageCircle, Send, Copy, Languages,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Echo" },
      { name: "description", content: "Upload a consultation. Get a clear summary, medication timeline, and forgotten questions." },
      { property: "og:title", content: "Echo Dashboard" },
      { property: "og:description", content: "Turn consultations into actionable summaries." },
    ],
  }),
  component: Dashboard,
});

type Stage = "idle" | "upload" | "transcribe" | "analyze" | "done";

function Dashboard() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [namesOpen, setNamesOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [participants, setParticipants] = useState<{ doctor: string; patient: string } | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const runPipeline = (name: string) => {
    setFileName(name);
    setStage("upload");
    setProgress(0);
    let p = 0;
    const tick = setInterval(() => {
      p += 4;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(tick);
        setStage("transcribe");
        setTimeout(() => setStage("analyze"), 1600);
        setTimeout(() => {
          setStage("done");
          toast.success("Summary ready", { description: "5 questions generated." });
        }, 3400);
      }
    }, 70);
  };

  const promptForNames = (name: string) => {
    setPendingFile(name);
    setDoctorName("");
    setPatientName("");
    setNamesOpen(true);
  };

  const confirmNames = () => {
    const d = doctorName.trim();
    const p = patientName.trim();
    if (!d || !p) {
      toast.error("Names required", { description: "Enter both doctor and patient name." });
      return;
    }
    setParticipants({ doctor: d, patient: p });
    setNamesOpen(false);
    const f = pendingFile;
    setPendingFile(null);
    if (f) runPipeline(f);
  };

  const onFile = (f: File) => {
    if (!/\.(mp3|wav|m4a)$/i.test(f.name) || f.size > 10 * 1024 * 1024) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error("Invalid file", { description: "MP3 or WAV under 10MB." });
      return;
    }
    promptForNames(f.name);
  };

  const handleRecord = () => {
    if (recording) {
      setRecording(false);
      promptForNames("live-recording.wav");
    } else {
      setRecording(true);
      toast("Recording started", { description: "Tap again to stop." });
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 pt-10 pb-24">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Consultation studio</h1>
            <p className="text-muted-foreground mt-1">Upload audio or record live — Echo handles the rest.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="glass gap-1.5"><Languages className="w-3 h-3" /> EN · HI · TA</Badge>
            <Badge variant="outline" className="glass gap-1.5 text-success border-success/30">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Mic OK
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: capture */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard variant="strong" className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold">Capture audio</h2>
                <span className="text-xs font-mono text-muted-foreground">MP3 · WAV · &lt; 10MB</span>
              </div>

              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) onFile(f);
                }}
                className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                  dragOver ? "border-primary bg-primary/5" : "border-border"
                } ${shake ? "animate-shake" : ""}`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".mp3,.wav,audio/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                />
                <div className="w-14 h-14 rounded-2xl mx-auto glass grid place-items-center mb-3">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium">Drop your file or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Audio is processed in your browser session.</p>
                {fileName && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-mono">
                    <FileAudio className="w-3.5 h-3.5" />{fileName}
                  </div>
                )}
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or record live</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex flex-col items-center">
                <RecordingButton recording={recording} onClick={handleRecord} />
                <p className="mt-3 text-sm text-muted-foreground">
                  {recording ? "Listening..." : "Tap to start"}
                </p>
                {recording && <AudioVisualizer className="mt-4" />}
              </div>
            </GlassCard>

            {/* Pipeline */}
            <GlassCard className="p-6">
              <h2 className="font-semibold mb-4">Processing pipeline</h2>
              <div className="space-y-3">
                <PipelineStep label="Audio input" icon={<FileAudio className="w-4 h-4" />} state={stageState("upload", stage)} progress={progress} />
                <PipelineStep label="Transcription" icon={<AudioWaveform className="w-4 h-4" />} state={stageState("transcribe", stage)} />
                <PipelineStep label="AI analysis" icon={<Brain className="w-4 h-4" />} state={stageState("analyze", stage)} />
                <PipelineStep label="Summary ready" icon={<CheckCircle2 className="w-4 h-4" />} state={stage === "done" ? "active" : "idle"} />
              </div>
            </GlassCard>
          </div>

          {/* RIGHT: results */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {stage !== "done" ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassCard variant="strong" className="p-12 text-center min-h-[500px] grid place-items-center">
                    <div>
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-20 h-20 rounded-3xl mx-auto glass grid place-items-center mb-4"
                      >
                        <Brain className="w-9 h-9 text-primary" />
                      </motion.div>
                      <h3 className="text-xl font-semibold">Awaiting consultation</h3>
                      <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                        Upload or record audio and Echo will produce a clear summary, medication plan, and follow-up questions.
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Results participants={participants} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Dialog open={namesOpen} onOpenChange={(o) => { if (!o) { setNamesOpen(false); setPendingFile(null); } }}>
        <DialogContent className="glass-strong rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Who's in this consultation?</DialogTitle>
            <DialogDescription>
              Enter names so Echo can label the transcript and summary correctly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="doctor-name" className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" /> Doctor's name
              </Label>
              <Input
                id="doctor-name"
                placeholder="e.g. Dr. Mehta"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-name" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-trust" /> Patient's name
              </Label>
              <Input
                id="patient-name"
                placeholder="e.g. Ravi Kumar"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmNames(); }}
              />
            </div>
            {pendingFile && (
              <p className="text-xs text-muted-foreground font-mono">File: {pendingFile}</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setNamesOpen(false); setPendingFile(null); }}>
              Cancel
            </Button>
            <Button onClick={confirmNames} className="gradient-primary text-primary-foreground border-0">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function stageState(target: Stage, current: Stage): "idle" | "active" | "done" {
  const order: Stage[] = ["idle", "upload", "transcribe", "analyze", "done"];
  const ti = order.indexOf(target);
  const ci = order.indexOf(current);
  if (ci > ti) return "done";
  if (ci === ti) return "active";
  return "idle";
}

function PipelineStep({
  label, icon, state, progress,
}: { label: string; icon: React.ReactNode; state: "idle" | "active" | "done"; progress?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl grid place-items-center transition-colors ${
        state === "done" ? "bg-success text-success-foreground" :
        state === "active" ? "gradient-primary text-primary-foreground animate-pulse-glow" :
        "bg-muted text-muted-foreground"
      }`}>
        {state === "active" ? <Loader2 className="w-4 h-4 animate-spin" /> :
         state === "done" ? <CheckCircle2 className="w-4 h-4" /> : icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className={state === "idle" ? "text-muted-foreground" : "font-medium"}>{label}</span>
          {state === "active" && progress !== undefined && <span className="text-xs font-mono text-muted-foreground">{progress}%</span>}
        </div>
        {state === "active" && progress !== undefined && (
          <Progress value={progress} className="h-1 mt-1.5" />
        )}
      </div>
    </div>
  );
}

const summary = [
  { kind: "diagnosis", title: "Type 2 diabetes — early stage", urgency: "amber" as const },
  { kind: "vital", title: "Blood pressure 138/86 — borderline", urgency: "amber" as const },
  { kind: "lifestyle", title: "Increase walking to 30 min/day", urgency: "green" as const },
  { kind: "lab", title: "HbA1c re-test in 12 weeks", urgency: "green" as const },
  { kind: "warning", title: "Return immediately if vision blurs", urgency: "red" as const },
];

const meds = [
  { name: "Metformin", dose: "500 mg", freq: "2× day", time: "After meals", color: "primary" },
  { name: "Atorvastatin", dose: "10 mg", freq: "1× night", time: "Bedtime", color: "trust" },
  { name: "Vitamin D3", dose: "60,000 IU", freq: "Weekly", time: "Sunday", color: "warning" },
];

const questions = [
  { q: "What if I miss a dose of metformin?", a: "Take it as soon as you remember, unless it's almost time for your next dose. Never double up." },
  { q: "Can I still eat rice and roti?", a: "Yes, but smaller portions and pair with vegetables and protein to slow sugar release." },
  { q: "What are warning signs of low blood sugar?", a: "Shaking, sweating, sudden hunger, dizziness. Eat sugar immediately and call the clinic." },
  { q: "How will I know if the medication is working?", a: "Your next HbA1c test in 12 weeks should be lower. Keep a home glucose log." },
  { q: "Are there foods I should completely avoid?", a: "Sugary drinks, sweets, and deep-fried foods. Limit white bread and white rice." },
];

function urgencyClass(u: "green" | "amber" | "red") {
  return u === "red" ? "bg-alert/15 text-alert border-alert/30" :
         u === "amber" ? "bg-warning/15 text-warning border-warning/30" :
         "bg-success/15 text-success border-success/30";
}

function Results({ participants }: { participants: { doctor: string; patient: string } | null }) {
  const doctor = participants?.doctor ?? "Doctor";
  const patient = participants?.patient ?? "Patient";
  return (
    <GlassCard variant="strong" className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Consultation summary</h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{doctor} · {patient} · 14 Apr 2026 · 6m 12s</p>
        </div>
        <ShareMenu />
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="glass rounded-xl">
          <TabsTrigger value="summary" className="rounded-lg">Summary</TabsTrigger>
          <TabsTrigger value="questions" className="rounded-lg">Forgotten questions</TabsTrigger>
          <TabsTrigger value="transcript" className="rounded-lg">Transcript</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key findings</h3>
            <ul className="space-y-2">
              {summary.map((s, i) => (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/40"
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-md border grid place-items-center ${urgencyClass(s.urgency)}`}>
                    {s.urgency === "red" ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{s.title}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${urgencyClass(s.urgency)}`}>
                    {s.urgency === "red" ? "Critical" : s.urgency === "amber" ? "Important" : "Routine"}
                  </Badge>
                </motion.li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Pill className="w-4 h-4" /> Medication timeline
            </h3>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {meds.map((m, i) => (
                  <motion.div
                    key={m.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="min-w-[180px] glass rounded-2xl p-4 hover:shadow-elegant transition-shadow"
                  >
                    <div className={`w-10 h-10 rounded-xl grid place-items-center mb-3 ${
                      m.color === "primary" ? "bg-primary/15 text-primary" :
                      m.color === "trust" ? "bg-trust/15 text-trust" : "bg-warning/15 text-warning"
                    }`}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="font-mono text-xs text-muted-foreground mt-0.5">{m.dose}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="w-3 h-3" />{m.freq} · {m.time}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="mt-5">
          <p className="text-sm text-muted-foreground mb-4">
            5 questions you didn't get to ask, generated from this consultation.
          </p>
          <Accordion type="single" collapsible className="space-y-2">
            {questions.map((item, i) => (
              <AccordionItem key={item.q} value={`q-${i}`} className="glass rounded-xl px-4 border-0">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <span className="font-mono text-xs text-primary">Q{i + 1}</span>
                    <span className="font-medium">{item.q}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  <p>{item.a}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="glass h-8 gap-1.5">
                      <MessageSquarePlus className="w-3.5 h-3.5" /> Ask Echo
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 gap-1.5">
                      <Bookmark className="w-3.5 h-3.5" /> Save
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="transcript" className="mt-5">
          <ScrollArea className="h-[400px] rounded-xl bg-muted/30 p-4">
            <div className="space-y-4 text-sm">
              {[
                { who: "Doctor", text: "So your sugar levels are slightly elevated. We'll start metformin 500 mg twice a day." },
                { who: "Patient", text: "Will I need to take this forever?" },
                { who: "Doctor", text: "Not necessarily — if your lifestyle improves and HbA1c comes down, we can review in 12 weeks." },
                { who: "Doctor", text: "I'm also adding atorvastatin for cholesterol, take one at night." },
                { who: "Patient", text: "Can I still eat rice?" },
                { who: "Doctor", text: "Yes, smaller portions, with vegetables. Walk 30 minutes daily." },
              ].map((t, i) => (
                <div key={i} className="flex gap-3">
                  <Badge variant={t.who === "Doctor" ? "default" : "secondary"} className={t.who === "Doctor" ? "gradient-primary text-primary-foreground border-0" : ""}>
                    {t.who === "Doctor" ? doctor : patient}
                  </Badge>
                  <p className="flex-1">
                    {t.text.split(/\b(metformin|atorvastatin|HbA1c|sugar|cholesterol)\b/gi).map((part, j) =>
                      /metformin|atorvastatin|HbA1c|sugar|cholesterol/i.test(part) ? (
                        <mark key={j} className="bg-primary/15 text-primary font-medium px-1 rounded">{part}</mark>
                      ) : <span key={j}>{part}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
}

function ShareMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="glass gap-2"><Send className="w-3.5 h-3.5" /> Share</Button>
      </PopoverTrigger>
      <PopoverContent className="glass-strong rounded-2xl w-64 p-2">
        {[
          { icon: <MessageCircle className="w-4 h-4 text-success" />, label: "Send via WhatsApp" },
          { icon: <Send className="w-4 h-4 text-trust" />, label: "Send via SMS" },
          { icon: <Download className="w-4 h-4 text-primary" />, label: "Download PDF" },
          { icon: <Copy className="w-4 h-4 text-muted-foreground" />, label: "Copy link" },
        ].map((o) => (
          <button key={o.label} onClick={() => toast.success(o.label)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/60 text-sm transition-colors">
            {o.icon}{o.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
