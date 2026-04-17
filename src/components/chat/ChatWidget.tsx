import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MessageCircle, X, Send, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "ai"; text: string };

const quickReplies = [
  "Explain my medication",
  "Side effects to watch?",
  "Diet advice",
  "When to call doctor?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi 👋 I'm Echo. Ask me anything about your last consultation with Dr. Mehta." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: aiReply(text) }]);
      setTyping(false);
    }, 1200);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary text-primary-foreground grid place-items-center shadow-glow"
        aria-label="Open chat"
        style={{ display: open ? "none" : "grid" }}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-alert animate-ping" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-alert" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[560px] glass-strong rounded-3xl flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-glass-border">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl gradient-primary grid place-items-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Echo Assistant</p>
                  <p className="text-xs text-muted-foreground">Knows your last visit</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-accent grid place-items-center" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                    m.role === "user"
                      ? "gradient-primary text-primary-foreground rounded-br-sm"
                      : "glass rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex">
                  <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
              {quickReplies.map((q) => (
                <motion.button
                  key={q}
                  whileHover={{ y: -2 }}
                  onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-full glass border border-glass-border hover:border-primary/40 transition-colors"
                >
                  {q}
                </motion.button>
              ))}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="p-3 border-t border-glass-border flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your visit..."
                className="bg-muted/50 border-0 rounded-xl"
              />
              <Button type="button" size="icon" variant="ghost" className="rounded-xl" aria-label="Voice">
                <Mic className="w-4 h-4" />
              </Button>
              <Button type="submit" size="icon" className="rounded-xl gradient-primary border-0 text-primary-foreground" aria-label="Send">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function aiReply(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("medication") || lower.includes("metformin")) return "You're on Metformin 500mg twice daily after meals, and Atorvastatin 10mg at bedtime. Take consistently for best results.";
  if (lower.includes("side")) return "Watch for nausea, mild stomach upset (usually settles in a week), or muscle pain from atorvastatin. Call the clinic if persistent.";
  if (lower.includes("diet")) return "Smaller portions of rice/roti, more vegetables and protein, no sugary drinks. A 30-minute walk daily makes a big difference.";
  if (lower.includes("call") || lower.includes("doctor")) return "Call immediately for blurred vision, chest pain, severe weakness, or signs of low blood sugar (shaking + sweating).";
  return "Based on your consultation, I'd suggest discussing this with Dr. Mehta at your next visit. In the meantime, follow your medication schedule strictly.";
}
