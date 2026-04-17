import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
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

interface ProcessingStatus {
  currentStage: string;
  progress: number;
  completed: boolean;
  error: string | null;
  stages: {
    upload: { status: string; progress: number; message: string };
    transcribe: { status: string; progress: number; message: string };
    analyze: { status: string; progress: number; message: string };
    generate: { status: string; progress: number; message: string };
  };
}

interface ConsultationResults {
  sessionId: string;
  doctorName: string;
  patientName: string;
  createdAt: string;
  audioDuration: number | null;
  summary: {
    diagnosis: Array<{ title: string; urgency: "green" | "amber" | "red" }>;
    medications: Array<{ name: string; dose: string; frequency: string; timing: string; color: "primary" | "trust" | "warning" }>;
    nextSteps: Array<{ title: string; urgency: "green" | "amber" | "red" }>;
    warnings: Array<{ title: string; urgency: "red" }>;
    importantNotes: Array<{ title: string; urgency: "green" | "amber" | "red" }>;
    vitals: Array<{ title: string; urgency: "green" | "amber" | "red" }>;
    lifestyle: Array<{ title: string; urgency: "green" }>;
    labs: Array<{ title: string; urgency: "green" }>;
  } | null;
  questions: {
    questions: string[];
    answers: string[];
  } | null;
  transcript: {
    segments: Array<{ speaker: string; text: string; startTime: number; endTime: number }>;
    cleanedText: string;
  } | null;
  status: ProcessingStatus;
}

function Dashboard() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Map<number, string>>(new Map());
  const [loadingAnswers, setLoadingAnswers] = useState<Set<number>>(new Set());
  const [recording, setRecording] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [namesOpen, setNamesOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [participants, setParticipants] = useState<{ doctor: string; patient: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<ConsultationResults | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);

  const API_BASE = "http://localhost:3001/api";

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("processing-progress", (status: ProcessingStatus) => {
      console.log("Processing progress:", status);
      setProgress(status.progress);
      
      if (status.error) {
        setProcessingError(status.error);
        setStage("idle");
        toast.error("Processing failed", { description: status.error });
        return;
      }

      if (status.currentStage === "upload") {
        setStage("upload");
      } else if (status.currentStage === "transcribe") {
        setStage("transcribe");
      } else if (status.currentStage === "analyze") {
        setStage("analyze");
      } else if (status.currentStage === "generate") {
        setStage("analyze");
      } else if (status.completed) {
        setStage("done");
        fetchResults(status.sessionId);
        toast.success("Summary ready", { description: "Consultation processed successfully." });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchResults = async (sid: string) => {
    try {
      const response = await fetch(`${API_BASE}/results/${sid}`);
      if (!response.ok) throw new Error("Failed to fetch results");
      const data = await response.json();
      setResults(data);
      setParticipants({ doctor: data.doctorName, patient: data.patientName });
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Failed to load results");
    }
  };

  const askEcho = async (question: string, questionIndex: number) => {
    if (!results || !sessionId) return;

    setLoadingAnswers(prev => new Set(prev).add(questionIndex));

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          question
        })
      });

      if (!response.ok) throw new Error("Failed to get answer");

      const data = await response.json();
      setQuestionAnswers(prev => new Map(prev).set(questionIndex, data.answer));
    } catch (error) {
      console.error("Error asking Echo:", error);
      toast.error("Echo couldn't answer", { description: "Please try again." });
    } finally {
      setLoadingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionIndex);
        return newSet;
      });
    }
  };

  const uploadFile = async (file: File, doctor: string, patient: string) => {
    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("doctorName", doctor);
      formData.append("patientName", patient);

      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setFileName(file.name);
        setStage("upload");
        setProgress(0);
        
        if (socket) {
          socket.emit("join-session", data.sessionId);
        }

        setTimeout(() => {
          pipelineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);

        toast.success("Upload successful", { description: "Processing started..." });
      } else {
        const error = await response.json();
        toast.error("Upload failed", { description: error.message || "Please try again." });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed", { description: "Network error. Please try again." });
    }
  };

  const recordAudio = async (audioBlob: Blob, doctor: string, patient: string) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const audioData = base64Audio.split(",")[1];

        const response = await fetch(`${API_BASE}/record`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doctorName: doctor,
            patientName: patient,
            audioData,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
          setFileName("live-recording.wav");
          setStage("upload");
          setProgress(0);

          if (socket) {
            socket.emit("join-session", data.sessionId);
          }

          setTimeout(() => {
            pipelineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);

          toast.success("Recording saved", { description: "Processing started..." });
        } else {
          const error = await response.json();
          toast.error("Recording failed", { description: error.message || "Please try again." });
        }
      };
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Recording failed", { description: "Network error. Please try again." });
    }
  };

  const promptForNames = (file: File) => {
    setPendingFile(file);
    setDoctorName("");
    setPatientName("");
    setNamesOpen(true);
    setProcessingError(null); // Clear any previous errors
  };

  const confirmNames = async () => {
    const d = doctorName.trim();
    const p = patientName.trim();
    if (!d || !p) {
      toast.error("Names required", { description: "Enter both doctor and patient name." });
      return;
    }
    setParticipants({ doctor: d, patient: p });
    setNamesOpen(false);
    const file = pendingFile;
    setPendingFile(null);
    if (file) {
      await uploadFile(file, d, p);
    }
  };

  const onFile = (f: File) => {
    if (!/\.(mp3|wav|m4a)$/i.test(f.name) || f.size > 10 * 1024 * 1024) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error("Invalid file", { description: "MP3, WAV, or M4A under 10MB." });
      return;
    }
    promptForNames(f);
  };

  const handleRecord = async () => {
    if (recording) {
      setRecording(false);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(mediaStream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        promptForNames(new File([audioBlob], "live-recording.wav", { type: "audio/wav" }));
        mediaStream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      
      setTimeout(() => {
        mediaRecorder.stop();
      }, 100);
    } else {
      setRecording(true);
      toast("Recording started", { description: "Tap again to stop recording." });
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
            <GlassCard className="p-6" ref={pipelineRef}>
              <h2 className="font-semibold mb-4">Processing pipeline</h2>
              <div className="space-y-3">
                <PipelineStep label="Audio input" icon={<FileAudio className="w-4 h-4" />} state={stageState("upload", stage)} progress={progress} />
                <PipelineStep label="Transcription" icon={<AudioWaveform className="w-4 h-4" />} state={stageState("transcribe", stage)} progress={progress} />
                <PipelineStep label="AI analysis" icon={<Brain className="w-4 h-4" />} state={stageState("analyze", stage)} progress={progress} />
                <PipelineStep label="Summary ready" icon={<CheckCircle2 className="w-4 h-4" />} state={stage === "done" ? "done" : "idle"} />
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
                  ref={resultsRef}
                >
                  <Results results={results} questionAnswers={questionAnswers} loadingAnswers={loadingAnswers} askEcho={askEcho} />
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
              <p className="text-xs text-muted-foreground font-mono">File: {pendingFile.name}</p>
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

function urgencyClass(u: "green" | "amber" | "red") {
  return u === "red" ? "bg-alert/15 text-alert border-alert/30" :
         u === "amber" ? "bg-warning/15 text-warning border-warning/30" :
         "bg-success/15 text-success border-success/30";
}

function Results({ results, questionAnswers, loadingAnswers, askEcho }: { 
  results: ConsultationResults | null; 
  questionAnswers: Map<number, string>;
  loadingAnswers: Set<number>;
  askEcho: (question: string, index: number) => void;
}) {
  if (!results) {
    return (
      <GlassCard variant="strong" className="p-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </GlassCard>
    );
  }

  const doctor = results.doctorName;
  const patient = results.patientName;
  const date = new Date(results.createdAt).toLocaleDateString();
  const duration = results.audioDuration 
    ? `${Math.floor(results.audioDuration / 60)}m ${Math.floor(results.audioDuration % 60)}s`
    : "--";

  const allFindings = [
    ...(results.summary?.diagnosis || []).map(item => ({ ...item, kind: "diagnosis" })),
    ...(results.summary?.vitals || []).map(item => ({ ...item, kind: "vital" })),
    ...(results.summary?.lifestyle || []).map(item => ({ ...item, kind: "lifestyle" })),
    ...(results.summary?.labs || []).map(item => ({ ...item, kind: "lab" })),
    ...(results.summary?.warnings || []).map(item => ({ ...item, kind: "warning" })),
    ...(results.summary?.importantNotes || []).map(item => ({ ...item, kind: "note" })),
  ];

  return (
    <GlassCard variant="strong" className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Consultation summary</h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{doctor} · {patient} · {date} · {duration}</p>
        </div>
        <ShareMenu sessionId={results.sessionId} />
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
              {allFindings.length > 0 ? (
                allFindings.map((s, i) => (
                  <motion.li
                    key={`${s.kind}-${i}`}
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
                ))
              ) : (
                <li className="text-sm text-muted-foreground p-3 rounded-xl bg-muted/40">
                  No key findings available.
                </li>
              )}
            </ul>
          </div>

          {results.summary?.medications && results.summary.medications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4" /> Medication timeline
              </h3>
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-2">
                  {results.summary.medications.map((m, i) => (
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
                        <CalendarClock className="w-3 h-3" />{m.frequency} · {m.timing}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="mt-5">
          <p className="text-sm text-muted-foreground mb-4">
            {results.questions?.questions.length || 0} questions you didn't get to ask, generated from this consultation.
          </p>
          <div className="space-y-2">
            {results.questions && results.questions.questions.length > 0 ? (
              results.questions.questions.map((question, i) => (
                <div key={`q-${i}`} className="glass rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs text-primary mt-1">Q{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{question}</p>
                      
                      {questionAnswers.has(i) ? (
                        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-sm text-foreground">{questionAnswers.get(i)}</p>
                        </div>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="glass h-8 gap-1.5"
                            onClick={() => askEcho(question, i)}
                            disabled={loadingAnswers.has(i)}
                          >
                            {loadingAnswers.has(i) ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Asking...
                              </>
                            ) : (
                              <>
                                <MessageSquarePlus className="w-3.5 h-3.5" /> Ask Echo
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground p-4 rounded-xl bg-muted/40">
                No questions generated yet.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transcript" className="mt-5">
          <ScrollArea className="h-[400px] rounded-xl bg-muted/30 p-4">
            <div className="space-y-4 text-sm">
              {results.transcript && results.transcript.segments.length > 0 ? (
                results.transcript.segments.map((segment, i) => (
                  <div key={i} className="flex gap-3">
                    <Badge 
                      variant={segment.speaker.toLowerCase().includes("doctor") ? "default" : "secondary"} 
                      className={segment.speaker.toLowerCase().includes("doctor") ? "gradient-primary text-primary-foreground border-0" : ""}
                    >
                      {segment.speaker}
                    </Badge>
                    <p className="flex-1">
                      {segment.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground p-4">
                  No transcript available yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </GlassCard>
  );
}

function ShareMenu({ sessionId }: { sessionId: string }) {
  const downloadPDF = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/export/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, format: "pdf" }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `echo-consultation-${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("PDF downloaded", { description: "Consultation summary saved." });
      } else {
        toast.error("Download failed", { description: "Could not generate PDF." });
      }
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Download failed", { description: "Network error." });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="glass gap-2"><Send className="w-3.5 h-3.5" /> Share</Button>
      </PopoverTrigger>
      <PopoverContent className="glass-strong rounded-2xl w-64 p-2">
        {[
          { icon: <MessageCircle className="w-4 h-4 text-success" />, label: "Send via WhatsApp", action: () => toast.success("WhatsApp share", { description: "Feature coming soon!" }) },
          { icon: <Send className="w-4 h-4 text-trust" />, label: "Send via SMS", action: () => toast.success("SMS share", { description: "Feature coming soon!" }) },
          { icon: <Download className="w-4 h-4 text-primary" />, label: "Download PDF", action: downloadPDF },
          { icon: <Copy className="w-4 h-4 text-muted-foreground" />, label: "Copy link", action: () => {
            navigator.clipboard.writeText(`http://localhost:5173/dashboard?session=${sessionId}`);
            toast.success("Link copied", { description: "Share this link with others." });
          }},
        ].map((o) => (
          <button key={o.label} onClick={o.action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/60 text-sm transition-colors">
            {o.icon}{o.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
